import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm DelaySense AI. Ask me anything about your supply chain data.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');

  const quickPrompts = [
    "What's the delay trend this week?",
    'Which suppliers have the highest delay rate?',
    'Show lead-time anomalies for last 30 days',
    'Compare supplier performance',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    const aiResponse: Message = {
      id: messages.length + 2,
      role: 'assistant',
      content:
        "I'm analyzing your request. In a production environment, I would query your Supabase data and provide insights based on your supply chain metrics.",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInput('');

    toast({
      title: 'Message sent',
      description: 'AI is processing your request',
    });
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <span className="gradient-text">Ask DelaySense AI</span>
          </h1>
          <p className="text-muted-foreground font-medium">Get instant insights about your supply chain</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card p-6 h-[600px] flex flex-col bg-gradient-to-br from-card to-primary/5">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-secondary text-white'
                          : 'bg-card border-2 border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {message.role === 'assistant' && <MessageSquare className="w-4 h-4 mt-1" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <span className="text-xs opacity-70 mt-2 block">{message.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about delays, suppliers, routes..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Quick Prompts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="glass-card p-6 bg-gradient-to-br from-secondary/5 to-transparent">
              <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Quick Prompts</h3>
              <div className="space-y-2">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{prompt}</span>
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="glass-card p-6 bg-gradient-to-br from-accent/5 to-transparent">
              <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ask about specific suppliers or routes</li>
                <li>• Request date-range comparisons</li>
                <li>• Get predictions and recommendations</li>
                <li>• Explore anomalies and patterns</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
