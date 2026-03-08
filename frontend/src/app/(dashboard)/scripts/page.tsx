'use client';

import { useState } from 'react';
import { useScripts, useCreateScript } from '@/hooks/use-scripts';
import { useNiches } from '@/hooks/use-niches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ScrollText } from 'lucide-react';

export default function ScriptsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const limit = 12;

  const { data, isLoading, isError, error } = useScripts({ page, limit });
  const { data: niches } = useNiches();
  const createScript = useCreateScript();

  const [form, setForm] = useState({
    name: '',
    category: '',
    nicheId: '',
    content: '',
  });

  const resetForm = () => setForm({ name: '', category: '', nicheId: '', content: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createScript.mutateAsync({
      name: form.name,
      category: form.category || undefined,
      nicheId: form.nicheId || undefined,
      content: form.content,
    });
    resetForm();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scripts Library</h1>
          <p className="text-muted-foreground">Browse and manage scripts for video proposals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Script
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Script</DialogTitle>
                <DialogDescription>
                  Add a new script to the library. The first version will be created automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="scriptName">Script Name *</Label>
                  <Input
                    id="scriptName"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. AI Automation Intro"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Cold Outreach"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="niche">Niche</Label>
                    <Select
                      value={form.nicheId}
                      onValueChange={(v) => setForm((p) => ({ ...p, nicheId: v }))}
                    >
                      <SelectTrigger id="niche">
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {niches?.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Script Content *</Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Write the script content here..."
                    rows={8}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createScript.isPending || !form.name || !form.content}
                >
                  {createScript.isPending ? 'Creating...' : 'Create Script'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Failed to load scripts. {(error as Error)?.message || 'Unknown error'}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((script) => {
              const latestVersion =
                script.versions && script.versions.length > 0
                  ? script.versions[script.versions.length - 1]
                  : null;
              const isExpanded = expandedScript === script.id;

              return (
                <Card
                  key={script.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedScript(isExpanded ? null : script.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{script.name}</CardTitle>
                      </div>
                      {script.versions && (
                        <Badge variant="outline" className="text-xs">
                          v{script.versions.length}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex gap-2">
                      {script.category && <Badge variant="secondary">{script.category}</Badge>}
                      {script.niche && <Badge variant="outline">{script.niche.name}</Badge>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latestVersion ? (
                      <p className="text-sm text-muted-foreground">
                        {isExpanded
                          ? latestVersion.content
                          : latestVersion.content.length > 120
                            ? latestVersion.content.slice(0, 120) + '...'
                            : latestVersion.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No versions yet</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      by {script.createdBy?.firstName || script.createdBy?.email || 'Unknown'}{' '}
                      &middot; {new Date(script.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.data.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No scripts found. Create one to get started.
              </CardContent>
            </Card>
          )}

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page >= data.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
