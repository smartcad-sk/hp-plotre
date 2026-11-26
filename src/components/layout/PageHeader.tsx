import type { PageType } from "@/lib/analytics";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Prose } from "@/components/ui/Prose";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

type Props = {
  title: string;
  lead?: string;
  leadHtml?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  /** Analytics page classification (read by PageViewTracker). */
  pageType?: PageType;
};

/** Page title band – the only <h1> on a page. */
export function PageHeader({ title, lead, leadHtml, crumbs, children, pageType = "page" }: Props) {
  return (
    <div className="relative overflow-hidden bg-brand-700 text-white" data-page-type={pageType} data-location="page_header">
      <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-500/40 blur-3xl" />
      <Container className="relative space-y-4 py-10 sm:py-14">
        {crumbs && <Breadcrumbs items={crumbs} current={title} invert />}
        <Heading level={1} size="display" className="max-w-4xl">
          {title}
        </Heading>
        {lead && <p className="max-w-3xl text-lg text-white/90 sm:text-xl">{lead}</p>}
        {leadHtml && <Prose html={leadHtml} invert className="max-w-3xl text-lg" />}
        {children}
      </Container>
    </div>
  );
}
