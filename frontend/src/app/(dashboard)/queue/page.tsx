'use client';

import { useState } from 'react';
import { useNiches } from '@/hooks/use-niches';
import { useProposalQueue, useClaimProposal } from '@/hooks/use-proposals';
import { useAuthContext } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Layers, UserCheck } from 'lucide-react';

function NicheQueueTable({ nicheId }: { nicheId: string }) {
  const { data: proposals, isLoading, isError } = useProposalQueue(nicheId);
  const claimProposal = useClaimProposal();

  const handleClaim = async (proposalId: string) => {
    await claimProposal.mutateAsync(proposalId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="py-12 text-center text-destructive">Failed to load queue.</div>;
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No unclaimed proposals in this niche.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Bid Amount</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <TableCell>
              <div>
                <p className="font-medium">{proposal.jobTitle || 'Untitled'}</p>
                {proposal.jobUrl && (
                  <a
                    href={proposal.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View Job
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {proposal.client?.name || '---'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {proposal.bidAmount ? `$${proposal.bidAmount.toLocaleString()}` : '---'}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[200px] truncate">
              {proposal.notes || '---'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(proposal.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                onClick={() => handleClaim(proposal.id)}
                disabled={claimProposal.isPending}
              >
                <UserCheck className="mr-1 h-3 w-3" />
                Claim
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function QueuePage() {
  const { data: niches, isLoading: nichesLoading } = useNiches();
  const [activeNiche, setActiveNiche] = useState<string>('');

  const activeNicheId = activeNiche || niches?.[0]?.id || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Niche Queue</h1>
        <p className="text-muted-foreground">
          Browse unclaimed proposals by niche and claim them for closing
        </p>
      </div>

      {nichesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !niches || niches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No niches available. Contact an admin to set up niches.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeNicheId} onValueChange={setActiveNiche}>
          <TabsList>
            {niches.map((niche) => (
              <TabsTrigger key={niche.id} value={niche.id}>
                <Layers className="mr-1 h-3 w-3" />
                {niche.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {niches.map((niche) => (
            <TabsContent key={niche.id} value={niche.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{niche.name} Queue</CardTitle>
                  <CardDescription>
                    {niche.description || 'Unclaimed proposals in this niche'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <NicheQueueTable nicheId={niche.id} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
