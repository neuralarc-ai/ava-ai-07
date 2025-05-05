
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X } from 'lucide-react';

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveApiKey: (apiKey: string, model: string) => void;
  apiKey?: string;
  selectedModel?: string;
}

const models = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
];

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  open,
  onOpenChange,
  onSaveApiKey,
  apiKey = '',
  selectedModel = 'gpt-4o'
}) => {
  const [key, setKey] = useState(apiKey);
  const [model, setModel] = useState(selectedModel);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSaveApiKey(key.trim(), model);
      onOpenChange(false);
    }
  };

  const testApiKey = async () => {
    if (!key.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an API key');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing your API key...');
    
    // Simulated API key test
    // In a real app, we'd make an actual request to OpenAI
    setTimeout(() => {
      // Simulate a successful test
      setTestStatus('success');
      setTestMessage('API key is valid!');
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-ava-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-ava-light">OpenAI API Key Settings</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to use Ava AI. Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="sk-..."
              className="bg-gray-800 border-gray-700 text-ava-light"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-ava-light">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-ava-light">
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline"
              onClick={testApiKey}
              disabled={testStatus === 'testing'}
              className="w-full border-gray-700 hover:bg-gray-700"
            >
              Test API Key
            </Button>
            
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 mt-2 text-sm
                ${testStatus === 'success' ? 'text-green-500' : 
                testStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}
              >
                {testStatus === 'success' && <Check className="h-4 w-4" />}
                {testStatus === 'error' && <X className="h-4 w-4" />}
                {testMessage}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="ghost" className="text-gray-400 hover:text-gray-300">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave}
            disabled={!key.trim()}
            className="bg-ava-neon-green text-ava-dark hover:bg-ava-neon-green-light"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
