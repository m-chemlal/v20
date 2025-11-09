import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Indicator, IndicatorEntry } from '@/types/project';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface IndicatorEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator;
}

export function IndicatorEntryFormModal({
  isOpen,
  onClose,
  indicator,
}: IndicatorEntryFormModalProps) {
  const { addIndicatorEntry } = useAppStore();
  const { user } = useAuthStore();
  const [value, setValue] = useState(indicator.currentValue);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(indicator.currentValue);
      setNotes('');
      setFile(null);
    }
  }, [isOpen, indicator]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }

    // Validation
    if (value < 0) {
      toast.error('Value cannot be negative.');
      setIsLoading(false);
      return;
    }

    // Simulate file upload
    let evidenceUrl = '';
    if (file) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate upload time
      evidenceUrl = `https://mock-evidence-storage.com/${file.name}-${Date.now()}`;
    }

    // Create new entry
    const newEntry: Omit<IndicatorEntry, 'id'> = {
      indicatorId: indicator.id,
      value: value,
      notes: notes || undefined,
      evidence: evidenceUrl || undefined,
      createdAt: new Date(),
      createdBy: user.id,
    };

    addIndicatorEntry(newEntry);

    toast.success(
      `Indicator "${indicator.name}" updated to ${value} ${indicator.unit}.`
    );

    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Indicator: {indicator.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              New Value ({indicator.unit})
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="col-span-3"
              required
              min={0}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Explain the change and progress..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="evidence" className="text-right">
              Evidence (File)
            </Label>
            <div className="col-span-3">
              <input
                id="evidence"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="evidence"
                className="flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted transition-colors"
              >
                {file ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {file.name}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Choose File (Simulation)
                  </>
                )}
              </label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Entry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
