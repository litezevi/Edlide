# Image Support in Edlide IDE Chat

## 2026-01-11 Update: Hidden Image-Only Model (GLM-4.6V)

Added support for hidden image-only model `zai-org/GLM-4.6V`:
- Model is hidden from UI dropdowns and settings
- Used internally for image processing
- Context window: 131,072 tokens

### Files Modified

**voidSettingsTypes.ts** - Added isUIHidden for GLM-4.6V:
```typescript
isUIHidden: (providerName === 'edlide' && modelName === 'openai/gpt-oss-120b-TEE') ||
            (providerName === 'edlide' && modelName === 'zai-org/GLM-4.6V'),
```

**voidSettingsService.ts** - Exclude hidden models from modelOptions:
```typescript
if (!(modelName === 'openai/gpt-oss-120b-TEE' && providerName === 'edlide') &&
    !(modelName === 'zai-org/GLM-4.6V' && providerName === 'edlide') &&
    !isHidden) {
  newModelOptions.push({ name: `${modelName} (${providerTitle})`, selection: { providerName, modelName } })
}
```

**modelCapabilities.ts** - Added GLM-4.6V configuration:
```typescript
'zai-org/GLM-4.6V': {
  contextWindow: 131_072,
  reservedOutputTokenSpace: 8_192,
  cost: { input: 0, output: 0 },
  downloadable: false,
  supportsFIM: false,
  supportsSystemMessage: 'system-role',
  specialToolFormat: 'openai-style',
  reasoningCapabilities: false,
}
```

**Settings.tsx** - Updated display name and hidden logic:
```typescript
if (modelName === 'zai-org/GLM-4.6V') return 'zai-org/GLM-4.6'

// Skip hidden models from UI (like GLM-4.6V which is image-only)
if (providerName === 'edlide' && model.modelName === 'zai-org/GLM-4.6V') continue
```

---

## Overview

Implemented image attachment support for the Edlide IDE chat interface. Users can now attach images to their chat messages using three methods:
1. **Drag & Drop** - Drag images from outside the application directly into the chat
2. **Ctrl+V** - Paste images from clipboard
3. **File picker** - Click the image icon button in the input area

## Image Limit

**Maximum 5 images per message.** When trying to add more images, users receive a notification: "Maximum 5 images per message allowed." If multiple images are selected and some exceed the limit, a notification shows how many were actually added.

## Changes by File

---

### 1. `src/vs/workbench/contrib/void/common/chatThreadServiceTypes.ts`

**Location**: Lines adding new type definition

**Added type**:
```typescript
export type ChatImageAttachment = {
  id: string;           // Generated via generateUuid()
  file: File;           // Original File object
  previewUrl: string;   // DataURL for image preview
  name: string;         // Filename
  size: number;         // File size in bytes
  type: string;         // MIME type (e.g., "image/png")
};
```

**Purpose**: Defines the structure for storing image attachments in the chat.

---

### 2. `src/vs/workbench/contrib/void/browser/chatThreadService.ts`

**Locations and changes**:

#### a) Import statement (Line ~27)
```typescript
import { ChatMessage, CheckpointEntry, ChatImageAttachment, ... } from '../common/chatThreadServiceTypes.js';
```

#### b) Thread state initialization (Function `newThreadObject()`, Line ~310)
Added `chatImages: []` to the thread state:
```typescript
return {
  id: generateUuid(),
  createdAt: now,
  lastModified: now,
  messages: [],
  state: {
    currCheckpointIdx: null,
    stagingSelections: [],
    focusedMessageIdx: undefined,
    linksOfMessageIdx: {},
    chatImages: [],  // <-- NEW: Images attached to current message
    isCompacted: undefined,
  },
  filesWithUserChanges: new Set()
} satisfies ThreadType;
```

#### c) Interface IChatThreadService declaration (Lines ~240-250)
Added four new methods to the interface:
```typescript
// chat images
getCurrentChatImages: () => ChatImageAttachment[]
addChatImage: (image: ChatImageAttachment) => void
removeChatImage: (id: string) => void
clearChatImages: () => void
```

#### d) Method implementations (Lines ~1930-1960)
```typescript
// Get current thread's images
getCurrentChatImages(): ChatImageAttachment[] {
  return this.getCurrentThreadState().chatImages ?? [];
}

// Add image to current thread
addChatImage(image: ChatImageAttachment): void {
  const threadId = this.state.currentThreadId;
  const thread = this.state.allThreads[threadId];
  if (!thread) return;

  const currentImages = thread.state.chatImages ?? [];
  this._setThreadState(threadId, { chatImages: [...currentImages, image] });
}

// Remove image by ID
removeChatImage(id: string): void {
  const threadId = this.state.currentThreadId;
  const thread = this.state.allThreads[threadId];
  if (!thread) return;

  const currentImages = thread.state.chatImages ?? [];
  this._setThreadState(threadId, { chatImages: currentImages.filter(img => img.id !== id) });
}

// Clear all images
clearChatImages(): void {
  const threadId = this.state.currentThreadId;
  this._setThreadState(threadId, { chatImages: [] });
}
```

**Purpose**: Manages image state persistence across the chat thread lifecycle.

---

### 3. `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

This is the main file with the most changes. Here's a detailed breakdown:

#### a) Imports (Lines ~1-40)
```typescript
// New icon import
import { ..., Image } from 'lucide-react';

// New type import
import { ..., ChatImageAttachment } from '../../../../common/chatThreadServiceTypes.js';

// UUID generator import
import { generateUuid } from '../../../../../../../base/common/uuid.js';

// Notification service import
const notificationService = accessor.get('INotificationService')
```

#### b) ImagePreviewModal Component (Lines ~612-651)

**Location**: After `ToolHeaderWrapper` component, before `ChatImageThumbnails`

**Structure**:
```typescript
const ImagePreviewModal = ({ image, onClose }: { image: ChatImageAttachment; onClose: () => void }) => {
  // ESC key handler for closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    return () => window.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative">
        <button
          className="absolute -top-3 -right-3 text-white hover:text-gray-300 cursor-pointer z-60 bg-black/50 rounded-full p-1"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <img
          src={image.previewUrl}
          alt={image.name}
          className="max-w-[50vw] max-h-[45vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded text-sm whitespace-nowrap">
        {image.name}
      </div>
    </div>
  );
};
```

**Styling**:
- Modal: `fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4`
- Close button: Absolute positioned at top-right corner of image container
- Image: `max-w-[50vw] max-h-[45vh] object-contain` (responsive)
- Filename: Absolute positioned at bottom center

#### c) ChatImageThumbnails Component (Lines ~654-689)

**Purpose**: Renders thumbnail previews above the chat input

```typescript
const ChatImageThumbnails = ({
  images,
  onRemove,
  onPreview
}: {
  images: ChatImageAttachment[];
  onRemove: (id: string) => void;
  onPreview: (image: ChatImageAttachment) => void;
}) => {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative group w-6 h-6 cursor-pointer"
          onClick={() => onPreview(img)}
        >
          <img
            src={img.previewUrl}
            alt={img.name}
            className="w-full h-full object-cover rounded-sm"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={10} className="text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};
```

**Features**:
- Displays thumbnails in a flex wrap container
- Thumbnail size: `w-6 h-6` (24x24 pixels)
- Object fit: `object-cover` for proper aspect ratio
- Remove button appears on hover (opacity transition)
- Clicking thumbnail opens full-size preview modal

#### d) VoidChatArea Props Extension (Lines ~880-890)

**Added new props to VoidChatArea interface**:
```typescript
interface VoidChatAreaProps {
  // ... existing props ...

  // NEW: Chat images props
  chatImages?: ChatImageAttachment[];
  onRemoveImage?: (id: string) => void;
  onPreviewImage?: (image: ChatImageAttachment) => void;
  onAddImage?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
```

#### e) VoidChatArea Implementation (Lines ~960-1020)

**Added to the main div container**:
```typescript
<div
  ref={divRef}
  className={`...`}
  onClick={(e) => { onClickAnywhere?.(); }}
  onPaste={onPaste}
  onDragOver={onDragOver}
  onDrop={onDrop}
>
```

**Added image thumbnail section** (between Selections and Input section):
```typescript
{/* Chat Images thumbnails */}
{chatImages && chatImages.length > 0 && (
  <ChatImageThumbnails
    images={chatImages}
    onRemove={onRemoveImage || (() => {})}
    onPreview={onPreviewImage || (() => {})}
  />
)}
```

**Added image upload button** (in the bottom row, left of context bar):
```typescript
<div className="flex items-center gap-2">
  {/* Image upload button */}
  {onAddImage && (
    <button
      onClick={onAddImage}
      className="p-1 text-void-fg-3 hover:text-void-fg-1 cursor-pointer"
      title="Attach image"
    >
      <Image size={18} />
    </button>
  )}

  {/* Context bar - positioned left of stop/submit buttons */}
  {showContextBar && (
    <ContextProgressBar percentage={contextPercentage} size="md" tooltipText={contextTooltipText} />
  )}

  {/* Stop/Submit buttons */}
  {isStreaming ? <ButtonStop onClick={onAbort} /> : <ButtonSubmit onClick={onSubmit} disabled={isDisabled} />}
</div>
```

#### f) SidebarChat State Management (Lines ~3559-3680)

**Local state initialization**:
```typescript
// ----- Chat Images state -----
const [chatImages, setChatImages] = useState<ChatImageAttachment[]>([]);
const [previewImage, setPreviewImage] = useState<ChatImageAttachment | null>(null);
const fileInputRef = useRef<HTMLInputElement | null>(null);
```

**Load images from thread state on mount/thread change**:
```typescript
useEffect(() => {
  const images = chatThreadsService.getCurrentChatImages();
  setChatImages(images);
}, [chatThreadsService, chatThreadsState.currentThreadId]);
```

**Image file handler** (converts File to ChatImageAttachment with DataURL):
```typescript
const handleImageFile = useCallback((file: File) => {
  if (!file.type.startsWith('image/')) return
  if (chatImages.length >= 5) {
    notificationService.info('Maximum 5 images per message allowed.')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const image: ChatImageAttachment = {
      id: generateUuid(),
      file,
      previewUrl: e.target?.result as string,
      name: file.name,
      size: file.size,
      type: file.type
    }
    setChatImages(prev => [...prev, image])
    chatThreadsService.addChatImage(image)
  }
  reader.readAsDataURL(file)
}, [chatThreadsService, chatImages.length])
```

**File input change handler**:
```typescript
const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (files) {
    const remainingSlots = 5 - chatImages.length
    if (remainingSlots <= 0) {
      notificationService.info('Maximum 5 images per message allowed.')
      return
    }
    const filesToAdd = Array.from(files).slice(0, remainingSlots)
    if (filesToAdd.length < files.length) {
      notificationService.info(`Only ${filesToAdd.length} of ${files.length} images added. Maximum 5 images per message.`)
    }
    filesToAdd.forEach(handleImageFile)
  }
  if (fileInputRef.current) {
    fileInputRef.current.value = ''
  }
}, [handleImageFile, chatImages.length, notificationService])
```

**Drag and drop handlers**:
```typescript
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault()
}, [])

const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  const remainingSlots = 5 - chatImages.length
  if (remainingSlots <= 0) {
    notificationService.info('Maximum 5 images per message allowed.')
    return
  }
  const filesToAdd = imageFiles.slice(0, remainingSlots)
  if (filesToAdd.length < imageFiles.length) {
    notificationService.info(`Only ${filesToAdd.length} of ${imageFiles.length} images added. Maximum 5 images per message.`)
  }
  filesToAdd.forEach(handleImageFile)
}, [handleImageFile, chatImages.length, notificationService])
```

**Image removal handler**:
```typescript
const handleRemoveImage = useCallback((id: string) => {
  setChatImages(prev => prev.filter(img => img.id !== id));
  chatThreadsService.removeChatImage(id);
}, [chatThreadsService]);
```

**Image preview handler**:
```typescript
const handlePreviewImage = useCallback((image: ChatImageAttachment) => {
  setPreviewImage(image);
}, []);
```

**Close preview handler**:
```typescript
const handleClosePreview = useCallback(() => {
  setPreviewImage(null);
}, []);
```

**Global paste handler** (document-level for reliable Ctrl+V):
```typescript
useEffect(() => {
  const handleGlobalPaste = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData?.files.length) return;

    const imageFiles = Array.from(clipboardData.files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      e.preventDefault();
      imageFiles.forEach(handleImageFile);
    }
  };

  document.addEventListener('paste', handleGlobalPaste as EventListener);
  return () => document.removeEventListener('paste', handleGlobalPaste as EventListener);
}, [handleImageFile]);
```

**Updated onSubmit to clear images**:
```typescript
const onSubmit = useCallback(async (_forceSubmit?: string) => {
  // ... send message ...

  setSelections([]);       // Clear staging
  setChatImages([]);       // NEW: Clear images
  chatThreadsService.clearChatImages();
  textAreaFnsRef.current?.setValue('');
  textAreaRef.current?.focus();
}, [chatThreadsService, isDisabled, isRunning, textAreaRef, textAreaFnsRef, setSelections, settingsState]);
```

#### g) inputChatArea Component Usage (Lines ~4020-4060)

**Pass all image handlers to VoidChatArea**:
```typescript
const inputChatArea = (
  <VoidChatArea
    featureName='Chat'
    onSubmit={() => onSubmit()}
    onAbort={onAbort}
    isStreaming={!!isRunning}
    isDisabled={isDisabled}
    showSelections={true}
    selections={selections}
    setSelections={setSelections}
    onClickAnywhere={() => { textAreaRef.current?.focus(); }}
    contextPercentage={contextPercentage}
    showContextBar={showContextBar}
    contextTooltipText={`${currentTokens} / ${maxTokens} tokens used${isApiVerified ? ' (API verified)' : ''}`}
    chatImages={chatImages}
    onRemoveImage={handleRemoveImage}
    onPreviewImage={handlePreviewImage}
    onAddImage={() => fileInputRef.current?.click()}
  >
    <VoidInputBox2
      enableAtToMention
      className={`min-h-[81px] px-0.5 py-0.5`}
      placeholder={`@ to mention, ${keybindingString ? `${keybindingString} to add a selection. ` : ''}Enter instructions...`}
      onChangeText={onChangeText}
      onKeyDown={onKeyDown}
      onFocus={() => { chatThreadsService.setCurrentlyFocusedMessageIdx(undefined); }}
      ref={textAreaRef}
      fnsRef={textAreaFnsRef}
      multiline={true}
    />
    {/* Hidden file input for image selection */}
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileInputChange}
      accept="image/*"
      multiple
      className="hidden"
    />
  </VoidChatArea>
);
```

#### h) Drag & Drop on Input Containers (Lines ~4090-4100)

**Added to threadPageInput**:
```typescript
const threadPageInput = <div key={'input' + chatThreadsState.currentThreadId}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
```

**Added to landingPageInput**:
```typescript
const landingPageInput = <div onDragOver={handleDragOver} onDrop={handleDrop}>
```

#### i) Modal Render in SidebarChat Return (Lines ~3945-3955)

```typescript
return (
  <Fragment key={threadId}>
    {isLandingPage ? landingPageContent : threadPageContent}

    {/* Image Preview Modal */}
    {previewImage && (
      <ImagePreviewModal
        image={previewImage}
        onClose={handleClosePreview}
      />
    )}
  </Fragment>
);
```

---

## Data Flow

```
User Action (Drag&Drop / Ctrl+V / File Picker)
         ↓
handleImageFile() / handleFileInputChange() / handleDrop()
         ↓
FileReader.readAsDataURL(file) → base64 previewUrl
         ↓
Create ChatImageAttachment object with:
  - id: generateUuid()
  - file: original File
  - previewUrl: dataURL
  - name, size, type
         ↓
setChatImages(prev => [...prev, image])  // Local state
chatThreadsService.addChatImage(image)   // Thread state persistence
         ↓
Render: ChatImageThumbnails component
         ↓
Click thumbnail → handlePreviewImage() → setPreviewImage()
         ↓
Render: ImagePreviewModal component
         ↓
Click X / ESC / Click outside → handleClosePreview() → setPreviewImage(null)
         ↓
onSubmit() → setChatImages([]) + chatThreadsService.clearChatImages()
```

---

## Styling Reference

| Element | Classes |
|---------|---------|
| Thumbnail container | `w-6 h-6 relative group cursor-pointer` |
| Thumbnail image | `w-full h-full object-cover rounded-sm` |
| Remove button (hover) | `absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity` |
| Preview modal overlay | `fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4` |
| Preview image | `max-w-[50vw] max-h-[45vh] object-contain` |
| Close button | `absolute -top-3 -right-3 text-white hover:text-gray-300 cursor-pointer z-60 bg-black/50 rounded-full p-1` |
| Filename label | `absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded text-sm whitespace-nowrap` |
| Upload button | `p-1 text-void-fg-3 hover:text-void-fg-1 cursor-pointer` |

---

## Key Implementation Details

1. **Image Preview**: Uses `FileReader.readAsDataURL()` to generate base64 previews
2. **UUID Generation**: Uses existing `generateUuid()` from base/common/uuid.js
3. **State Management**: Images stored both in local React state and persisted in thread state
4. **Global Paste Handler**: Document-level event listener ensures Ctrl+V works even when textarea isn't focused
5. **Event Propagation**: `e.stopPropagation()` and `e.preventDefault()` properly used to avoid conflicts
6. **File Type Validation**: Only files starting with `image/` are accepted
7. **Cleanup on Submit**: Images are cleared after message is sent
8. **Multiple Images**: Supports attaching multiple images at once
9. **Image Limit**: Maximum 5 images per message with user notifications when limit is reached
10. **Notifications**: Uses `INotificationService` to inform users about image limits
11. **Hidden Image Model**: `zai-org/GLM-4.6V` is hidden from UI but used as internal image-only model

---

## Files Modified Summary

| File | Purpose |
|------|---------|
| `chatThreadServiceTypes.ts` | Type definition for ChatImageAttachment |
| `chatThreadService.ts` | State management and methods for images |
| `SidebarChat.tsx` | UI components and event handlers |
| `voidSettingsTypes.ts` | Added isUIHidden for GLM-4.6V |
| `voidSettingsService.ts` | Exclude hidden models from UI dropdowns |
| `modelCapabilities.ts` | GLM-4.6V model configuration |
| `Settings.tsx` | Hide GLM-4.6V from models list, display name mapping |

---

## Last Updated

2026-01-11 (Added hidden image-only model GLM-4.6V, image limit 5 per message)