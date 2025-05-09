import React, { useState } from 'react';
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Moon, Globe, Shield } from "lucide-react";

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    reports: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  language: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      reports: true,
    },
    appearance: {
      theme: 'system',
      reducedMotion: false,
    },
    privacy: {
      shareData: false,
      analytics: true,
    },
    language: 'en',
  });

  const handleSave = () => {
    // Here you would typically save to backend/localStorage
    toast({
      title: "Settings Updated",
      description: "Your settings have been successfully saved.",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Customize your app experience</p>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        <div className="grid gap-6">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your health reports</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications for important updates</p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => 
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Reduce animation and motion effects</p>
                </div>
                <Switch
                  checked={settings.appearance.reducedMotion}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, reducedMotion: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Display Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share Health Data</Label>
                  <p className="text-sm text-muted-foreground">Allow sharing of anonymized health data for research</p>
                </div>
                <Switch
                  checked={settings.privacy.shareData}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, shareData: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usage Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the app by sharing usage data</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analytics: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings; 