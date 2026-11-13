import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { TestimonialCard } from "@/features/testimonials/components/testimonial-card";
import type { Testimonial } from "@/features/testimonials/schema";

/** Parent testimonials: CSS scroll-snap row on phones, three-column grid from `lg`. No carousel JS. */
export async function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const t = await getTranslations("Home.testimonials");

  return (
    <Section aria-labelledby="testimonials-title">
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] bg-gradient-warm"
      />
      <DecorBlob tone="highlight" className="parallax-strong top-20 -left-24 size-80" />
      <Doodle
        shape="blob"
        tone="soft"
        className="parallax-soft top-16 right-[10%] hidden size-20 md:block"
      />

      <SectionHeader
        id="testimonials-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />

      <Stagger
        as="ul"
        className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto px-5 pt-2 pb-6 lg:mx-0 lg:mt-14 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0"
      >
        {testimonials.map((testimonial, index) => (
          <StaggerItem
            key={testimonial.id}
            as="li"
            className="w-[85%] shrink-0 snap-start sm:w-[55%] lg:w-auto"
          >
            <TestimonialCard
              testimonial={testimonial}
              index={index}
              ratingLabel={t("rating", { rating: testimonial.rating })}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
