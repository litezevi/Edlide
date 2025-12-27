import { ChatInterface } from '@/components/chat/ChatInterface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Chat - Edlide',
  description: 'Chat with AI models powered by Chutes.ai integration',
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
          <p className="text-muted-foreground">
            Powered by open source models through Chutes.ai
          </p>
        </div>
        
        <ChatInterface />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Authenticated users can interact with AI models</p>
          <p>Requires Chutes account with appropriate permissions</p>
        </div>
      </div>
    </div>
  )
}