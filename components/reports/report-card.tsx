import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PublicReport } from '@/types';
import {
  timeAgo,
  formatCategory,
  formatUrgency,
  formatReportType,
  reportTypeBadgeVariant,
  urgencyBadgeVariant,
} from '@/lib/format';

interface ReportCardProps {
  report: PublicReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const typeInfo = formatReportType(report.reportType);
  const urgencyInfo = formatUrgency(report.urgency);

  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="p-4">
          {/* Top row: badges */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={reportTypeBadgeVariant(report.reportType)}>
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
            <Badge variant={urgencyBadgeVariant(report.urgency)}>
              {urgencyInfo.emoji} {urgencyInfo.label}
            </Badge>
            <Badge variant="outline">{formatCategory(report.category)}</Badge>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 font-semibold">{report.title}</h3>

          {/* Description preview */}
          {report.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {report.description}
            </p>
          )}

          {/* Contact info */}
          {report.contactPhone && (
            <p className="mt-2 text-xs text-offer">
              📞 {report.contactPhone}
              {report.contactName && ` — ${report.contactName}`}
            </p>
          )}

          {/* Bottom row: metadata */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {report.neighborhood && <span>📍 {report.neighborhood}</span>}
              <span>{timeAgo(report.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              {report.confirmationCount > 0 && (
                <span className="text-offer">
                  ✓ {report.confirmationCount}
                </span>
              )}
              {report.peopleAffected && (
                <span>👥 {report.peopleAffected}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
