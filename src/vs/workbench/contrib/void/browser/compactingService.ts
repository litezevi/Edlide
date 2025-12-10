/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { IChatThreadService } from './chatThreadService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { CompactingState } from '../common/chatThreadServiceTypes.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

export interface ICompactingService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeCompactingState: Event<{ threadId: string; state: CompactingState }>;

	isCompacting(threadId: string): boolean;
	getCompactingState(threadId: string): CompactingState | undefined;
	startCompacting(threadId: string): Promise<void>;
	cancelCompacting(threadId: string): void;
	getSummary(threadId: string): string;
}

export const ICompactingService = createDecorator<ICompactingService>('voidCompactingService');

export class CompactingService extends Disposable implements ICompactingService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeCompactingState = this._register(new Emitter<{ threadId: string; state: CompactingState }>());
	readonly onDidChangeCompactingState = this._onDidChangeCompactingState.event;

	private compactingStates = new Map<string, CompactingState>();
	private compactingCancellations = new Map<string, CancellationTokenSource>();

	constructor(
		@ILLMMessageService private readonly llmMessageService: ILLMMessageService,
		@IChatThreadService private readonly chatThreadService: IChatThreadService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
		@IStorageService private readonly storageService: IStorageService,
	) {
		super();
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
			// 1. Останавливаем текущий streaming если есть
			await this.chatThreadService.abortRunning(threadId);

			// 2. Отправляем запрос на summarization (AI уже имеет контекст)
			const summary = await this.sendSummarizationRequest(threadId, cancellationTokenSource.token);
			
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

			// 5. Сбрасываем контекстные токены
			this.resetContextTokens(threadId);

			// 6. Добавляем summarized сообщение в чат
			this.addSummaryToChat(threadId, summary);

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

			// Отправляем ТОЛЬКО prompt для summarization
			// AI уже имеет весь контекст в своем окне
			const llmCancelToken = this.llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				chatMode: null,
				messages: [
					{ 
						role: 'user', 
						content: prompt
					}
				],
				modelSelection,
				modelSelectionOptions: this.voidSettingsService.state.optionsOfModelSelection['Chat']?.[modelSelection.providerName as keyof typeof this.voidSettingsService.state.optionsOfModelSelection['Chat']]?.[modelSelection.modelName],
				overridesOfModel: this.voidSettingsService.state.overridesOfModel,
				logging: { 
					loggingName: `Compacting - ${threadId}`, 
					loggingExtras: { threadId, compacting: true } 
				},
				separateSystemMessage: "You are summarizing a conversation. Provide a concise summary of what was done and what needs to be done next. Keep it brief and focused.",
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
			
			const storedTokens = this.storageService.get(CHAT_TOKENS_STORAGE_KEY, StorageScope.APPLICATION);
			if (storedTokens) {
				const chatTokens = JSON.parse(storedTokens);
				if (chatTokens[threadId]) {
					chatTokens[threadId].actualTotalTokens = 0;
					chatTokens[threadId].isApiVerified = false;
					this.storageService.store(CHAT_TOKENS_STORAGE_KEY, JSON.stringify(chatTokens), StorageScope.APPLICATION, StorageTarget.USER);
				}
			}

			// Сбрасываем window storage
			if (typeof window !== 'undefined' && (window as any).__chatTokens) {
				if ((window as any).__chatTokens[threadId]) {
					(window as any).__chatTokens[threadId].actualTotalTokens = 0;
					(window as any).__chatTokens[threadId].isApiVerified = false;
				}
			}

			console.log(`[COMPACTING] Reset context tokens for thread ${threadId}`);
		} catch (error) {
			console.error(`[COMPACTING] Error resetting context tokens for thread ${threadId}:`, error);
		}
	}

	private addSummaryToChat(threadId: string, summary: string): void {
		try {
			// Получаем текущий thread
			const thread = this.chatThreadService.state.allThreads[threadId];
			if (thread) {
				// TODO: Добавить compacting сообщение через chatThreadService
				// Пока просто логируем
				console.log(`[COMPACTING] Would add summary to thread ${threadId}, length: ${summary.length}`);
			}
		} catch (error) {
			console.error(`[COMPACTING] Error adding summary to chat for thread ${threadId}:`, error);
		}
	}
}

registerSingleton(ICompactingService, CompactingService, InstantiationType.Delayed);