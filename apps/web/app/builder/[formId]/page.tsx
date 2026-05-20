"use client";

import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { useParams, useRouter } from "next/navigation";
import { useState, use } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ArrowLeftIcon, PlusIcon, Trash2Icon, GripVerticalIcon, SaveIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "~/components/ui/textarea";

export default function BuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  return (
    <RequireAuth>
      <BuilderContent params={params} />
    </RequireAuth>
  );
}

function BuilderContent({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();
  
  const { data: form, isLoading } = trpc.form.getById.useQuery({ formId });
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading builder...</div>;
  }
  
  if (!form) {
    return <div className="flex h-screen items-center justify-center">Form not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{form.title}</h1>
            <p className="text-xs text-muted-foreground">Status: {form.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* We'll handle save dynamically, but adding a save button for layout completeness */}
          <Button disabled variant="outline" size="sm" className="gap-2">
            <SaveIcon className="w-4 h-4" /> Saved
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fields">
            <FieldsEditor form={form} />
          </TabsContent>
          
          <TabsContent value="settings">
            <FormSettings form={form} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function FormSettings({ form }: { form: any }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");
  const [themeKey, setThemeKey] = useState(form.themeKey);
  const [visibility, setVisibility] = useState(form.visibility);
  
  const { data: themes } = trpc.form.getThemeCatalog.useQuery();
  
  const updateForm = trpc.form.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.form.getById.invalidate({ formId: form.id });
      utils.form.listMine.invalidate();
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to update settings");
    }
  });

  const handleSave = () => {
    updateForm.mutate({
      formId: form.id,
      title,
      description,
      themeKey: themeKey as any,
      visibility: visibility as any,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Settings</CardTitle>
        <CardDescription>Manage general settings for your form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={themeKey} onValueChange={setThemeKey}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes?.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label} ({t.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="UNLISTED">Unlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={updateForm.isPending}>
          {updateForm.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function FieldsEditor({ form }: { form: any }) {
  const utils = trpc.useUtils();
  
  const addField = trpc.form.addField.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId: form.id });
      toast.success("Field added");
    }
  });
  
  const removeField = trpc.form.removeField.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId: form.id });
      toast.success("Field removed");
    }
  });

  const handleAddField = (type: string) => {
    addField.mutate({
      formId: form.id,
      type: type as any,
      label: `New ${type.toLowerCase()} field`,
      required: false,
    });
  };

  const reorderFields = trpc.form.reorderFields.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId: form.id });
    }
  });

  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= form.fields.length) return;
    
    const fieldIds = form.fields.map((f: any) => f.id);
    const temp = fieldIds[currentIndex];
    fieldIds[currentIndex] = fieldIds[newIndex];
    fieldIds[newIndex] = temp;
    
    reorderFields.mutate({
      formId: form.id,
      fieldIdsInOrder: fieldIds
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-4">
        {form.fields.length === 0 ? (
          <div className="text-center py-12 bg-background border border-dashed rounded-lg">
            <p className="text-muted-foreground">No fields added yet. Add a field to get started.</p>
          </div>
        ) : (
          form.fields.map((field: any, index: number) => (
            <FieldItem 
              key={field.id} 
              field={field} 
              formId={form.id} 
              isFirst={index === 0}
              isLast={index === form.fields.length - 1}
              onMoveUp={() => handleReorder(index, 'up')}
              onMoveDown={() => handleReorder(index, 'down')}
              isReordering={reorderFields.isPending}
              onRemove={() => removeField.mutate({ formId: form.id, fieldId: field.id })}
              isDeleting={removeField.isPending && removeField.variables?.fieldId === field.id}
            />
          ))
        )}
      </div>
      
      <div className="w-full md:w-64 space-y-4">
        <Card className="sticky top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Add Field
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { type: "SHORT_TEXT", label: "Short Text" },
              { type: "LONG_TEXT", label: "Long Text" },
              { type: "NUMBER", label: "Number" },
              { type: "SINGLE_SELECT", label: "Single Select" },
              { type: "MULTI_SELECT", label: "Multi Select" },
              { type: "CHECKBOX", label: "Checkboxes" },
              { type: "DATE", label: "Date" },
            ].map((t) => (
              <Button 
                key={t.type}
                variant="outline" 
                className="w-full justify-start text-left" 
                size="sm"
                onClick={() => handleAddField(t.type)}
                disabled={addField.isPending}
              >
                <PlusIcon className="w-4 h-4 mr-2 opacity-50" />
                {t.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldItem({ 
  field, 
  formId, 
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  isReordering,
  onRemove, 
  isDeleting 
}: { 
  field: any, 
  formId: string, 
  isFirst: boolean,
  isLast: boolean,
  onMoveUp: () => void,
  onMoveDown: () => void,
  isReordering: boolean,
  onRemove: () => void, 
  isDeleting: boolean 
}) {
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  
  const [label, setLabel] = useState(field.label);
  const [helperText, setHelperText] = useState(field.helperText || "");
  const [placeholder, setPlaceholder] = useState(field.placeholder || "");
  const [required, setRequired] = useState(field.required);
  
  // For options (Select, Radio, Checkbox)
  const isOptionsType = ["SINGLE_SELECT", "MULTI_SELECT", "CHECKBOX"].includes(field.type);
  const [options, setOptions] = useState<string[]>((field.config?.options as string[]) || ["Option 1", "Option 2"]);

  // Type specific constraints
  const isTextType = ["SHORT_TEXT", "LONG_TEXT"].includes(field.type);
  const isNumberType = field.type === "NUMBER";
  const isDateType = field.type === "DATE";

  const [maxLength, setMaxLength] = useState<string>(field.config?.maxLength?.toString() || "");
  const [minVal, setMinVal] = useState<string>(field.config?.min?.toString() || "");
  const [maxVal, setMaxVal] = useState<string>(field.config?.max?.toString() || "");
  const [minDate, setMinDate] = useState<string>(field.config?.minDate || "");
  const [maxDate, setMaxDate] = useState<string>(field.config?.maxDate || "");

  const updateField = trpc.form.updateField.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
      setIsEditing(false);
      toast.success("Field updated");
    }
  });

  const handleSave = () => {
    let configToSave: any = {};
    if (isOptionsType) configToSave.options = options;
    if (isTextType && maxLength) configToSave.maxLength = parseInt(maxLength, 10);
    if (isNumberType) {
      if (minVal) configToSave.min = parseFloat(minVal);
      if (maxVal) configToSave.max = parseFloat(maxVal);
    }
    if (isDateType) {
      if (minDate) configToSave.minDate = minDate;
      if (maxDate) configToSave.maxDate = maxDate;
    }

    updateField.mutate({
      formId,
      fieldId: field.id,
      label,
      helperText: helperText || undefined,
      placeholder: placeholder || undefined,
      required,
      config: configToSave,
    });
  };

  if (isEditing) {
    return (
      <Card className="border-primary/50 shadow-sm ring-1 ring-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Field Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Helper Text (Optional)</Label>
              <Input value={helperText} onChange={(e) => setHelperText(e.target.value)} />
            </div>
            {!isOptionsType && (
              <div className="space-y-2">
                <Label>Placeholder (Optional)</Label>
                <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
              </div>
            )}
          </div>
          
          {isOptionsType && (
            <div className="space-y-2">
              <Label>Options (one per line)</Label>
              <Textarea 
                value={options.join("\n")} 
                onChange={(e) => setOptions(e.target.value.split("\n").filter(Boolean))}
                rows={4}
              />
            </div>
          )}

          {isTextType && (
            <div className="space-y-2">
              <Label>Maximum Length (Optional)</Label>
              <Input type="number" value={maxLength} onChange={(e) => setMaxLength(e.target.value)} />
            </div>
          )}

          {isNumberType && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Value (Optional)</Label>
                <Input type="number" value={minVal} onChange={(e) => setMinVal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Maximum Value (Optional)</Label>
                <Input type="number" value={maxVal} onChange={(e) => setMaxVal(e.target.value)} />
              </div>
            </div>
          )}

          {isDateType && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Date (Optional)</Label>
                <Input type="date" value={minDate} onChange={(e) => setMinDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Maximum Date (Optional)</Label>
                <Input type="date" value={maxDate} onChange={(e) => setMaxDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch id={`req-${field.id}`} checked={required} onCheckedChange={setRequired} />
            <Label htmlFor={`req-${field.id}`}>Required</Label>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 py-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={updateField.isPending}>
            {updateField.isPending ? "Saving..." : "Save Field"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="group transition-all hover:border-primary/30">
      <CardHeader className="py-4 flex flex-row items-start justify-between space-y-0">
        <div className="flex gap-3">
          <div className="cursor-grab text-muted-foreground opacity-50 hover:opacity-100 mt-1">
            <GripVerticalIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive text-sm">*</span>}
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-normal">
                {field.type}
              </span>
            </CardTitle>
            {field.helperText && <CardDescription className="mt-1">{field.helperText}</CardDescription>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={onMoveUp} 
            disabled={isFirst || isReordering}
          >
            <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
            <span className="sr-only">Move Up</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={onMoveDown} 
            disabled={isLast || isReordering}
          >
            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
            <span className="sr-only">Move Down</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
            <PencilIcon className="w-4 h-4 text-muted-foreground" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      {isOptionsType && options.length > 0 && (
        <CardContent className="pt-0 pb-4 ml-8">
          <div className="text-sm text-muted-foreground border-l-2 pl-3 py-1 space-y-1">
            {options.slice(0, 3).map((opt, i) => (
              <div key={i}>• {opt}</div>
            ))}
            {options.length > 3 && <div className="text-xs opacity-70">+{options.length - 3} more</div>}
          </div>
        </CardContent>
      )}
      
      {!isOptionsType && Object.keys(field.config || {}).length > 0 && (
        <CardContent className="pt-0 pb-4 ml-8">
          <div className="flex flex-wrap gap-2">
            {Object.entries(field.config).map(([k, v]) => (
              <span key={k} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
