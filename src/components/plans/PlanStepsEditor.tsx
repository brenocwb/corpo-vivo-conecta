import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MoveUp, MoveDown, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlanStep {
  id?: string;
  step_order: number;
  title: string;
  description: string;
  content: string;
}

interface PlanStepsEditorProps {
  steps: PlanStep[];
  onChange: (steps: PlanStep[]) => void;
}

export const PlanStepsEditor = ({ steps, onChange }: PlanStepsEditorProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const addStep = () => {
    const newStep: PlanStep = {
      step_order: steps.length + 1,
      title: '',
      description: '',
      content: '',
    };
    onChange([...steps, newStep]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      step_order: i + 1,
    }));
    onChange(reorderedSteps);
    setExpandedStep(null);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Reorder all steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      step_order: i + 1,
    }));
    
    onChange(reorderedSteps);
  };

  const updateStep = (index: number, field: keyof PlanStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Etapas do Plano</h3>
        <Button onClick={addStep} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              Nenhuma etapa adicionada ainda
            </p>
            <Button onClick={addStep} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Etapa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">Etapa {step.step_order}</Badge>
                    <CardTitle className="text-base">
                      {step.title || `Etapa ${step.step_order}`}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                    >
                      {expandedStep === index ? 'Recolher' : 'Expandir'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedStep === index && (
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título da Etapa</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      placeholder="Ex: Conhecendo a Bíblia"
                    />
                  </div>

                  <div>
                    <Label>Descrição Resumida</Label>
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      placeholder="Breve descrição do que será estudado"
                    />
                  </div>

                  <div>
                    <Label>Conteúdo Completo</Label>
                    <Textarea
                      value={step.content}
                      onChange={(e) => updateStep(index, 'content', e.target.value)}
                      placeholder="Conteúdo detalhado desta etapa..."
                      rows={6}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
