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
import { FormRenderer } from "~/components/forms/FormRenderer";

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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full shadow-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-800">{form.title}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                form.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {form.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">/f/{form.slug}</span>
              • Theme: <span className="font-medium text-slate-600 capitalize">{form.themeKey.replace("-", " ")}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {form.status === "PUBLISHED" && (
            <Button variant="default" size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={() => window.open(`/f/${form.slug}`, "_blank")}>
              View Live Form
            </Button>
          )}
          <Button disabled variant="outline" size="sm" className="gap-2 bg-slate-100 text-slate-500 border-slate-200">
            <SaveIcon className="w-4 h-4" /> Auto-saved
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="mb-8 bg-slate-200/50 p-1 flex w-full max-w-md mx-auto rounded-full shadow-inner">
            <TabsTrigger value="fields" className="flex-1 rounded-full text-xs font-semibold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Builder</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 rounded-full text-xs font-semibold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Settings</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 rounded-full text-xs font-semibold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Live Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fields" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <FieldsEditor form={form} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <FormSettings form={form} />
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-2xl overflow-hidden shadow-inner bg-slate-900/5 min-h-125">
              <FormRenderer form={form} isPreview={true} />
            </div>
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
      utils.form.listPublic.invalidate();
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
    <div className="max-w-2xl mx-auto">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5">
          <CardTitle className="text-xl">Form Settings</CardTitle>
          <CardDescription>Configure the underlying details and layout themes for your form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Form Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-50 border-slate-200 focus-visible:ring-primary/20" />
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="resize-none h-24 bg-slate-50 border-slate-200 focus-visible:ring-primary/20" 
              placeholder="Give respondents a little context about this form..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Form Theme</Label>
              <Select value={themeKey} onValueChange={setThemeKey}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes?.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label} <span className="text-[10px] text-slate-400 font-mono tracking-wider ml-2">{t.category.toUpperCase()}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select visibility status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="UNLISTED">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-end">
          <Button onClick={handleSave} disabled={updateForm.isPending} className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-6">
            {updateForm.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
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
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-5">
        {form.fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
              <PlusIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Your form is empty</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              Get started by adding fields from the menu on the right. Build exactly what you need.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {form.fields.map((field: any, index: number) => (
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
            ))}
          </div>
        )}
      </div>
      
      <div className="w-full md:w-72 space-y-4">
        <Card className="sticky top-24 border-slate-200/60 shadow-sm backdrop-blur-sm bg-white/60">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <PlusIcon className="w-3.5 h-3.5" />
              Add Field
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
            {[
              { type: "SHORT_TEXT", label: "Short Text", icon: "Aa" },
              { type: "LONG_TEXT", label: "Long Text", icon: "¶" },
              { type: "NUMBER", label: "Number", icon: "123" },
              { type: "SINGLE_SELECT", label: "Single Select", icon: "◉" },
              { type: "MULTI_SELECT", label: "Multi Select", icon: "☑" },
              { type: "CHECKBOX", label: "Checkbox", icon: "✓" },
              { type: "DATE", label: "Date", icon: "📅" },
            ].map((t) => (
              <Button 
                key={t.type}
                variant="outline" 
                className="flex flex-col items-center justify-center p-3 h-20 bg-white border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                onClick={() => handleAddField(t.type)}
                disabled={addField.isPending}
              >
                <div className="text-lg font-mono mb-1 font-bold text-slate-400 group-hover:text-primary transition-colors">{t.icon}</div>
                <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{t.label}</span>
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
    <Card className="group transition-all border-slate-200 shadow-sm hover:shadow-md hover:border-primary/50 bg-white relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-primary/50 transition-colors" />
      <CardHeader className="py-4 flex flex-row items-start justify-between space-y-0 pl-5">
        <div className="flex gap-3">
          <div className="cursor-grab text-slate-300 hover:text-slate-600 mt-1 transition-colors active:cursor-grabbing">
            <GripVerticalIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-semibold text-slate-800">
              {field.label}
              {field.required && <span className="text-rose-500 font-bold text-sm">*</span>}
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full ml-2">
                {field.type.replace("_", " ")}
              </span>
            </CardTitle>
            {field.helperText && <CardDescription className="mt-1.5 text-sm text-slate-500">{field.helperText}</CardDescription>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-50 p-1 rounded-xl shadow-sm border border-slate-100">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900" 
            onClick={onMoveUp} 
            disabled={isFirst || isReordering}
          >
            <ChevronUpIcon className="w-4 h-4" />
            <span className="sr-only">Move Up</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900" 
            onClick={onMoveDown} 
            disabled={isLast || isReordering}
          >
            <ChevronDownIcon className="w-4 h-4" />
            <span className="sr-only">Move Down</span>
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10" onClick={() => setIsEditing(true)}>
            <PencilIcon className="w-3.5 h-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2Icon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      
      {isOptionsType && options.length > 0 && (
        <CardContent className="pt-0 pb-5 pl-12">
          <div className="text-sm text-slate-500 border-l-2 border-slate-100 pl-4 py-1 space-y-2">
            {options.slice(0, 3).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 border border-slate-300 ${field.type === 'SINGLE_SELECT' ? 'rounded-full' : 'rounded-sm'} shrink-0`} />
                <span>{opt}</span>
              </div>
            ))}
            {options.length > 3 && <div className="text-xs font-semibold text-slate-400 mt-2 px-1">+{options.length - 3} more options</div>}
          </div>
        </CardContent>
      )}
      
      {!isOptionsType && Object.keys(field.config || {}).length > 0 && (
        <CardContent className="pt-0 pb-5 pl-12">
          <div className="flex flex-wrap gap-2">
            {Object.entries(field.config).map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono font-semibold bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-slate-500">
                {k}: <span className="text-slate-700">{String(v)}</span>
              </span>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
