"use client";

import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PlusIcon, SettingsIcon, Edit3Icon, Trash2Icon, GlobeIcon, LockIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your forms, view responses, and customize settings.
            </p>
          </div>
          <CreateFormDialog />
        </div>
        
        <FormsList />
      </main>
    </RequireAuth>
  );
}

function CreateFormDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themeKey, setThemeKey] = useState("movie-noir");
  const [visibility, setVisibility] = useState("PUBLIC");
  
  const router = useRouter();
  const { data: themes } = trpc.form.getThemeCatalog.useQuery();
  
  const utils = trpc.useUtils();
  const createForm = trpc.form.create.useMutation({
    onSuccess: (data) => {
      toast.success("Form created successfully!");
      setOpen(false);
      utils.form.listMine.invalidate();
      router.push(`/builder/${data.id}`);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to create form");
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.mutate({ title, description, themeKey: themeKey as any, visibility: visibility as any });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="w-4 h-4" />
          Create Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Set up the basics for your new form. You can customize the fields later in the builder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Feedback Survey"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this form..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={themeKey} onValueChange={setThemeKey}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes?.map((theme) => (
                    <SelectItem key={theme.key} value={theme.key}>
                      {theme.label} ({theme.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="UNLISTED">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createForm.isPending}>
              {createForm.isPending ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormsList() {
  const { data: forms, isLoading } = trpc.form.listMine.useQuery();
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const publishForm = trpc.form.publish.useMutation({
    onSuccess: () => {
      toast.success("Form published!");
      utils.form.listMine.invalidate();
    },
  });
  
  const unpublishForm = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Form unpublished!");
      utils.form.listMine.invalidate();
    },
  });

  const archiveForm = trpc.form.archive.useMutation({
    onSuccess: () => {
      toast.success("Form archived!");
      utils.form.listMine.invalidate();
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading forms...</div>;
  }

  if (!forms || forms.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Edit3Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle className="mb-2">No forms yet</CardTitle>
        <CardDescription>
          Create your first form to start collecting responses.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Card key={form.id} className="flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-2">
              <Badge variant={form.status === "PUBLISHED" ? "default" : "secondary"}>
                {form.status.toLowerCase()}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                {form.visibility === "PUBLIC" ? <GlobeIcon className="w-3 h-3" /> : <LockIcon className="w-3 h-3" />}
                {form.visibility.toLowerCase()}
              </div>
            </div>
            <CardTitle className="line-clamp-1">{form.title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              Updated {new Date(form.updatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{form.responseCount}</span> responses
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 flex justify-between gap-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/builder/${form.id}`)}>
              <SettingsIcon className="w-4 h-4 mr-2" /> Edit
            </Button>
            
            {form.status === "PUBLISHED" ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => unpublishForm.mutate({ formId: form.id })}
                disabled={unpublishForm.isPending}
              >
                Unpublish
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => publishForm.mutate({ formId: form.id })}
                disabled={publishForm.isPending || form.status === "ARCHIVED"}
              >
                Publish
              </Button>
            )}
            
            {form.status !== "ARCHIVED" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Are you sure you want to archive this form?")) {
                    archiveForm.mutate({ formId: form.id });
                  }
                }}
                disabled={archiveForm.isPending}
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
