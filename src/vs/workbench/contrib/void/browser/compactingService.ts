/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { CompactingState } from '../common/chatThreadServiceTypes.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

// Use any type to avoid circular dependency
type ChatThreadServiceType = any;

export interface ICompactingService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeCompactingState: Event<{ threadId: string; state: CompactingState }>;

	isCompacting(threadId: string): boolean;
	getCompactingState(threadId: string): CompactingState | undefined;
	startCompacting(threadId: string): Promise<void>;
	cancelCompacting(threadId: string): void;
	getSummary(threadId: string): string;
	setChatThreadService(chatThreadService: any): void;
}

export const ICompactingService = createDecorator<ICompactingService>('voidCompactingService');

export class CompactingService extends Disposable implements ICompactingService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeCompactingState = this._register(new Emitter<{ threadId: string; state: CompactingState }>());
	readonly onDidChangeCompactingState = this._onDidChangeCompactingState.event;

	private compactingStates = new Map<string, CompactingState>();
	private compactingCancellations = new Map<string, CancellationTokenSource>();
	private _chatThreadService: ChatThreadServiceType | null = null;

	constructor(
		@ILLMMessageService private readonly llmMessageService: ILLMMessageService,
		@IStorageService private readonly storageService: IStorageService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
	) {
		super();
	}

	setChatThreadService(chatThreadService: ChatThreadServiceType): void {
		this._chatThreadService = chatThreadService;
	}

	private get chatThreadService(): ChatThreadServiceType {
		if (!this._chatThreadService) {
			// Try to get from global window object (set by React components)
			if (typeof window !== 'undefined') {
				const globalService = (window as any).__voidChatThreadService;
				if (globalService) {
					this._chatThreadService = globalService;
					return this._chatThreadService;
				}
			}

			// Try from globalThis
			const globalService = (globalThis as any).__voidChatThreadService;
			if (globalService) {
				this._chatThreadService = globalService;
				return this._chatThreadService;
			}

			throw new Error('ChatThreadService not available - compacting cannot work without it');
		}
		return this._chatThreadService;
	}

	isCompacting(threadId: string): boolean {
		const state = this.compactingStates.get(threadId);
		return state?.isActive === true;
	}

	getCompactingState(threadId: string): CompactingState | undefined {
		return this.compactingStates.get(threadId);
	}

	getSummary(threadId: string): string {
		const state = this.compactingStates.get(threadId);
		return state?.summaryText || '';
	}

	async startCompacting(threadId: string): Promise<void> {
		console.log(`[COMPACTING] startCompacting called for thread ${threadId}`);
		
		// Если уже в процессе compacting, ничего не делаем
		if (this.isCompacting(threadId)) {
			console.log(`[COMPACTING] Already compacting thread ${threadId}`);
			return;
		}

		// Создаем токен отмены
		const cancellationTokenSource = new CancellationTokenSource();
		this.compactingCancellations.set(threadId, cancellationTokenSource);

		// Начальное состояние
		const initialState: CompactingState = {
			isActive: true,
			summaryText: '',
			progress: 0,
			error: null,
			retryCount: 0,
			threadId,
			startedAt: Date.now()
		};

		this.compactingStates.set(threadId, initialState);
		this._onDidChangeCompactingState.fire({ threadId, state: initialState });

		console.log(`[COMPACTING] Starting compacting for thread ${threadId}`);

		try {
			// 1. Отправляем запрос на summarization (AI уже имеет контекст)
			// Новый запрос автоматически остановит предыдущий
			console.log('[COMPACTING] Sending summarization request (will stop any active requests)...');
			const summary = await this.sendSummarizationRequest(threadId, cancellationTokenSource.token);
			
			console.log(`[COMPACTING] Received summary: ${summary.substring(0, 100)}...`);

			// 4. Обновляем состояние compacting как завершенное
			const completedState: CompactingState = {
				...initialState,
				isActive: false,
				summaryText: summary,
				progress: 100,
				error: null
			};

			this.compactingStates.set(threadId, completedState);
			this._onDidChangeCompactingState.fire({ threadId, state: completedState });

			console.log(`[COMPACTING] Compacting completed for thread ${threadId}, summary length: ${summary.length}`);

			// 5. Создаем summary в НОВОМ thread ПЕРЕД сбросом контекста старого thread
			await this.createSummaryInNewThread(threadId, summary);

			// 6. Помечаем старый thread как compacted
			this.chatThreadService.markThreadAsCompacted(threadId);

			// 7. Сбрасываем контекстные токены старого thread ПОСЛЕ пометки как compacted
			this.resetContextTokens(threadId);

			// 7. ВОССТАНАВЛИВАЕМ СОСТОЯНИЕ ЧАТА - просто очищаем стрим состояние
			try {
				// Принудительно очищаем состояние стрима
				(this.chatThreadService as any)._setStreamState(threadId, undefined);
				
				// Запускаем событие что чат обновился
				this.chatThreadService._onDidChangeCurrentThread.fire();
				
				console.log('[COMPACTING] Chat reactivated - ready for new messages');
			} catch (error) {
				console.warn('[COMPACTING] Error reactivating chat:', error);
			}

		} catch (error) {
			console.error(`[COMPACTING] Error during compacting for thread ${threadId}:`, error);

			// Проверяем отмену
			if (cancellationTokenSource.token.isCancellationRequested) {
				console.log(`[COMPACTING] Compacting cancelled for thread ${threadId}`);
				const cancelledState: CompactingState = {
					...initialState,
					isActive: false,
					error: 'Compacting cancelled',
					progress: 0
				};
				this.compactingStates.set(threadId, cancelledState);
				this._onDidChangeCompactingState.fire({ threadId, state: cancelledState });
				return;
			}

			// Повторная попытка (максимум 3 раза)
			const currentState = this.compactingStates.get(threadId);
			if (currentState && currentState.retryCount < 3) {
				const retryState: CompactingState = {
					...currentState,
					retryCount: currentState.retryCount + 1,
					error: `Retry ${currentState.retryCount + 1}/3: ${error instanceof Error ? error.message : String(error)}`,
					progress: 0
				};

				this.compactingStates.set(threadId, retryState);
				this._onDidChangeCompactingState.fire({ threadId, state: retryState });

				console.log(`[COMPACTING] Retrying compacting for thread ${threadId}, attempt ${retryState.retryCount}`);

				// Ждем 1 секунду перед повторной попыткой
				await new Promise(resolve => setTimeout(resolve, 1000));
				return this.startCompacting(threadId);
			}

			// После 3 попыток - ошибка
			const errorState: CompactingState = {
				...initialState,
				isActive: false,
				error: `Failed after 3 attempts: ${error instanceof Error ? error.message : String(error)}`,
				progress: 0
			};

			this.compactingStates.set(threadId, errorState);
			this._onDidChangeCompactingState.fire({ threadId, state: errorState });
		} finally {
			// Очищаем токен отмены
			cancellationTokenSource.dispose();
			this.compactingCancellations.delete(threadId);
		}
	}

	cancelCompacting(threadId: string): void {
		const cancellationTokenSource = this.compactingCancellations.get(threadId);
		if (cancellationTokenSource) {
			cancellationTokenSource.cancel();
			cancellationTokenSource.dispose();
			this.compactingCancellations.delete(threadId);
		}

		const currentState = this.compactingStates.get(threadId);
		if (currentState?.isActive) {
			const cancelledState: CompactingState = {
				...currentState,
				isActive: false,
				error: 'Compacting cancelled by user',
				progress: 0
			};
			this.compactingStates.set(threadId, cancelledState);
			this._onDidChangeCompactingState.fire({ threadId, state: cancelledState });
		}
	}

	private async sendSummarizationRequest(
		threadId: string, 
		cancellationToken: CancellationToken
	): Promise<string> {
		return new Promise((resolve, reject) => {
			if (cancellationToken.isCancellationRequested) {
				reject(new Error('Compacting cancelled'));
				return;
			}

			let accumulatedText = '';
			let isCompleted = false;

			const prompt = "Сделай саммари того что ты сделал и что нужно сделать";
			
			// Получаем настройки модели для Chat фичи
			const modelSelection = this.voidSettingsService.state.modelSelectionOfFeature['Chat'];
			if (!modelSelection) {
				throw new Error('No model selection found for Chat feature');
			}

			// Получаем текущие сообщения из чата для контекста
			let messagesToSend = [];
			try {
				const thread = this.chatThreadService.state.allThreads[threadId];
				if (thread && thread.messages) {
					// Конвертируем сообщения в формат для LLM
					messagesToSend = thread.messages
						.filter((msg: any) => msg.role === 'user' || msg.role === 'assistant') // Только user/assistant сообщения
						.map((msg: any) => ({
							role: msg.role,
							content: msg.role === 'user' ? msg.content : msg.displayContent
						}))
						.slice(-10); // Берем последние 10 сообщений для контекста
				}
			} catch (error) {
				console.warn('[COMPACTING] Could not get chat messages for context:', error);
			}

			// Добавляем наш prompt в конец
			messagesToSend.push({ 
				role: 'user', 
				content: prompt
			});

			console.log(`[COMPACTING] Sending ${messagesToSend.length} messages for context`);

			// Отправляем сообщения с контекстом
			const llmCancelToken = this.llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				chatMode: null,
				messages: messagesToSend,
				modelSelection,
				modelSelectionOptions: this.voidSettingsService.state.optionsOfModelSelection['Chat']?.[modelSelection.providerName as keyof typeof this.voidSettingsService.state.optionsOfModelSelection['Chat']]?.[modelSelection.modelName],
				overridesOfModel: this.voidSettingsService.state.overridesOfModel,
				logging: { 
					loggingName: `Compacting - ${threadId}`, 
					loggingExtras: { threadId, compacting: true } 
				},
				separateSystemMessage: "You are summarizing our conversation. Based on the messages above, provide a concise summary of what we've accomplished and what needs to be done next. Keep it brief and focused.",
				onText: ({ fullText, totalTokens }) => {
					if (cancellationToken.isCancellationRequested && llmCancelToken) {
						this.llmMessageService.abort(llmCancelToken);
						return;
					}

					accumulatedText = fullText;
					
					// Обновляем прогресс (оценка по длине текста)
					const progress = Math.min(99, Math.floor((accumulatedText.length / 500) * 100));
					
					const currentState = this.compactingStates.get(threadId);
					if (currentState) {
						const updatedState: CompactingState = {
							...currentState,
							summaryText: accumulatedText,
							progress
						};
						this.compactingStates.set(threadId, updatedState);
						this._onDidChangeCompactingState.fire({ threadId, state: updatedState });
					}
				},
				onFinalMessage: ({ fullText }) => {
					if (cancellationToken.isCancellationRequested) {
						reject(new Error('Compacting cancelled'));
						return;
					}

					isCompleted = true;
					resolve(fullText);
				},
				onError: async (error) => {
					if (cancellationToken.isCancellationRequested) {
						reject(new Error('Compacting cancelled'));
						return;
					}

					reject(error);
				},
				onAbort: () => {
					if (!isCompleted) {
						reject(new Error('Compacting aborted'));
					}
				},
			});

			// Сохраняем токен для возможной отмены
			if (llmCancelToken) {
				cancellationToken.onCancellationRequested(() => {
					this.llmMessageService.abort(llmCancelToken);
				});
			}
		});
	}

	private resetContextTokens(threadId: string): void {
		// Сбрасываем сохраненные токены в persistent storage
		try {
			const CHAT_TOKENS_STORAGE_KEY = 'void.chatTokens';
			
			// 1. Сбрасываем в persistent storage
			const storedTokens = this.storageService.get(CHAT_TOKENS_STORAGE_KEY, StorageScope.APPLICATION);
			if (storedTokens) {
				const chatTokens = JSON.parse(storedTokens);
				if (chatTokens[threadId]) {
					console.log(`[COMPACTING] Before reset - tokens: ${chatTokens[threadId].actualTotalTokens}`);
					chatTokens[threadId].actualTotalTokens = 0;
					chatTokens[threadId].isApiVerified = false;
					this.storageService.store(CHAT_TOKENS_STORAGE_KEY, JSON.stringify(chatTokens), StorageScope.APPLICATION, StorageTarget.USER);
					console.log(`[COMPACTING] After reset - tokens: ${chatTokens[threadId].actualTotalTokens}`);
				}
			}

			// 2. Сбрасываем window storage
			if (typeof window !== 'undefined' && (window as any).__chatTokens) {
				if ((window as any).__chatTokens[threadId]) {
					console.log(`[COMPACTING] Before reset window - tokens: ${(window as any).__chatTokens[threadId].actualTotalTokens}`);
					(window as any).__chatTokens[threadId].actualTotalTokens = 0;
					(window as any).__chatTokens[threadId].isApiVerified = false;
					console.log(`[COMPACTING] After reset window - tokens: ${(window as any).__chatTokens[threadId].actualTotalTokens}`);
				}
			}

			// 3. Принудительно обновляем UI через storage event
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new StorageEvent('storage', {
					key: CHAT_TOKENS_STORAGE_KEY,
					newValue: JSON.stringify({ [threadId]: { actualTotalTokens: 0, isApiVerified: false } })
				}));
			}

			console.log(`[COMPACTING] Successfully reset context tokens for thread ${threadId}`);
		} catch (error) {
			console.error(`[COMPACTING] Error resetting context tokens for thread ${threadId}:`, error);
		}
	}

private async createSummaryInNewThread(oldThreadId: string, summary: string): Promise<void> {
		try {
			console.log(`[COMPACTING] Creating summary in new thread from old thread: ${oldThreadId}`);
			
			// 1. Создать новый thread (метод автоматически делает его текущим)
			this.chatThreadService.openNewThread();
			
			// 2. Получить ID нового thread (он должен быть текущим)
			const newThreadId = this.chatThreadService.state.currentThreadId;
			if (!newThreadId) {
				throw new Error('Failed to get new thread ID after opening new thread');
			}
			
			console.log(`[COMPACTING] New thread created: ${newThreadId}`);
			
			// 3. УБЕДИТЬСЯ ЧТО НОВЫЙ THREAD НАЧИНАЕТ С ЧИСТОГО СОСТОЯНИЯ COMPACTING
			// Очищаем любое compacting состояние для нового thread
			if (this.compactingStates.has(newThreadId)) {
				this.compactingStates.delete(newThreadId);
				console.log(`[COMPACTING] Cleared any existing compacting state for new thread: ${newThreadId}`);
			}
			
			// 4. Добавить summary как первое сообщение в новый thread
			await this.chatThreadService.addUserMessageAndStreamResponse({
				userMessage: `📝 **Previous conversation summary:**\n\n${summary}`,
				threadId: newThreadId
			});
			
			console.log(`[COMPACTING] Summary successfully added to new thread: ${newThreadId} (from old: ${oldThreadId})`);
			console.log(`[COMPACTING] New thread ${newThreadId} is now ready for compacting when it reaches 80% context`);
		} catch (error) {
			console.error(`[COMPACTING] Failed to create summary in new thread:`, error);
			// Fallback: добавить в старый thread если новый не создался
			this.addSummaryToChatFallback(oldThreadId, summary);
		}
	}

	private addSummaryToChatFallback(threadId: string, summary: string): void {
		console.warn(`[COMPACTING] Using fallback: adding summary to old thread ${threadId}`);
		try {
			this.chatThreadService.addUserMessageAndStreamResponse({ 
				userMessage: `📝 **Previous conversation summary:**\n\n${summary}`,
				threadId: threadId 
			}).then(() => {
				console.log(`[COMPACTING] Fallback summary added successfully`);
			}).catch((error: any) => {
				console.error(`[COMPACTING] Error adding fallback summary:`, error);
			});
		} catch (error) {
			console.error(`[COMPACTING] Error in fallback for thread ${threadId}:`, error);
		}
	}
}

registerSingleton(ICompactingService, CompactingService, InstantiationType.Delayed);