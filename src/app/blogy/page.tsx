import type { Metadata } from "next";
import { CtaBand } from "@/components/blocks/CtaBand";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog o HP plotroch",
  description:
    "Novinky, porovnania, návody a tipy zo sveta HP DesignJet plotrov – T850, T950, atramenty, údržba a servis.",
  alternates: { canonical: "/blogy" },
};

const dateFmt = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export default function BlogPage() {
  const posts = getPosts();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ label: "Úvod", href: "/" }, { label: "Blog", href: "/blogy" }])} />
      <PageHeader
        title="Blog o HP plotroch"
        pageType="blog_index"
        lead="Novinky, porovnania a praktické návody od technikov smartCAD."
        crumbs={[{ label: "Úvod", href: "/" }]}
      />
      <Section>
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.route}>
                <Card
                  href={p.route}
                  title={p.title}
                  image={p.thumbnail}
                  imageFit="cover"
                  headingLevel={2}
                  eyebrow={dateFmt.format(new Date(p.date))}
                >
                  <p className="line-clamp-3">{p.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
