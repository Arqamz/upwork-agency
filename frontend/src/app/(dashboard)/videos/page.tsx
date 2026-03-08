'use client';

import { useState } from 'react';
import {
  useVideoProposals,
  useCreateVideoProposal,
  useDeleteVideoProposal,
  useGetUploadUrl,
  useIncrementViewCount,
} from '@/hooks/use-videos';
import { useProposals } from '@/hooks/use-proposals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Eye, Video, ExternalLink } from 'lucide-react';

export default function VideosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVideoProposals(page, 20);
  const createVideo = useCreateVideoProposal();
  const deleteVideo = useDeleteVideoProposal();
  const incrementView = useIncrementViewCount();
  const getUploadUrl = useGetUploadUrl();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    proposalId: '',
    videoUrl: '',
    storageKey: '',
    duration: '',
    fileSize: '',
    mimeType: 'video/mp4',
    thumbnailUrl: '',
  });

  const { data: proposalsData } = useProposals({ page: 1, limit: 100 });
  const proposals = proposalsData?.data ?? [];

  function resetForm() {
    setForm({
      proposalId: '',
      videoUrl: '',
      storageKey: '',
      duration: '',
      fileSize: '',
      mimeType: 'video/mp4',
      thumbnailUrl: '',
    });
  }

  function handleCreate() {
    if (!form.proposalId || !form.videoUrl || !form.storageKey) return;
    createVideo.mutate(
      {
        proposalId: form.proposalId,
        videoUrl: form.videoUrl,
        storageKey: form.storageKey,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        fileSize: form.fileSize ? parseInt(form.fileSize, 10) : undefined,
        mimeType: form.mimeType || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetForm();
        },
      },
    );
  }

  function handleGenerateUrl() {
    const fileName = `video-${Date.now()}.mp4`;
    getUploadUrl.mutate(fileName, {
      onSuccess: (result) => {
        setForm((prev) => ({
          ...prev,
          videoUrl: result.uploadUrl,
          storageKey: result.storageKey,
        }));
      },
    });
  }

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this video proposal?')) {
      deleteVideo.mutate(id);
    }
  }

  function formatDuration(seconds?: number) {
    if (!seconds) return '---';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '---';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const videos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Proposals</h1>
          <p className="text-muted-foreground">Manage video proposals for clients</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Video Proposal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Proposal</Label>
                <Select
                  value={form.proposalId}
                  onValueChange={(v) => setForm({ ...form, proposalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proposal" />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.jobTitle || p.client?.name || p.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Video URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateUrl}
                    disabled={getUploadUrl.isPending}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Storage Key</Label>
                <Input
                  value={form.storageKey}
                  onChange={(e) => setForm({ ...form, storageKey: e.target.value })}
                  placeholder="videos/uuid/file.mp4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label>File Size (bytes)</Label>
                  <Input
                    type="number"
                    value={form.fileSize}
                    onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                    placeholder="5242880"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>MIME Type</Label>
                  <Input
                    value={form.mimeType}
                    onChange={(e) => setForm({ ...form, mimeType: e.target.value })}
                    placeholder="video/mp4"
                  />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={
                  createVideo.isPending || !form.proposalId || !form.videoUrl || !form.storageKey
                }
              >
                {createVideo.isPending ? 'Creating...' : 'Create Video Proposal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No video proposals yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first video proposal to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              All Videos
              {meta && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({meta.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {video.proposal?.jobTitle || video.proposalId.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(video.duration)}</TableCell>
                    <TableCell>{formatFileSize(video.fileSize)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{video.mimeType || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{video.viewCount}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {video.videoUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => incrementView.mutate(video.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          disabled={deleteVideo.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
