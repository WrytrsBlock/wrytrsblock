import type { Metadata } from "next";
import { LegalPage, Section, P, Bullets, Term } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of WrytrsBlock — Blocks, Service Blocks, Block Parties, Featured Content, and Creator Profiles.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      category="Legal"
      title="Terms of Service"
      intro="These Terms govern your access to and use of WrytrsBlock, the creator collaboration platform of THE CR8TV COLLECTV. By creating an account or using the platform, you agree to these Terms."
      updated="June 6, 2026"
    >
      <Section n={1} title="Acceptance of these Terms">
        <P>
          WrytrsBlock (&ldquo;WrytrsBlock,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a platform where creators
          discover one another and collaborate through <Term>Blocks</Term>. By
          registering for, accessing, or using WrytrsBlock, you agree to be
          bound by these Terms of Service and by our{" "}
          <a href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/community-guidelines"
            className="text-accent hover:underline"
          >
            Community Guidelines
          </a>
          . If you do not agree, do not use WrytrsBlock.
        </P>
      </Section>

      <Section n={2} title="Eligibility and your account">
        <P>
          You must be at least 16 years old to use WrytrsBlock. You are
          responsible for the activity on your account and for keeping your
          login credentials secure. You agree to provide accurate information
          and to keep your <Term>Creator Profile</Term> up to date.
        </P>
        <Bullets
          items={[
            "One person or organization per account, unless we agree otherwise in writing.",
            "You are responsible for all Blocks you start, join, or host.",
            "Notify us promptly at support@wrytrsblock.com if you believe your account has been compromised.",
          ]}
        />
      </Section>

      <Section n={3} title="Creator Profiles and Featured Content">
        <P>
          Your <Term>Creator Profile</Term> and the{" "}
          <Term>Featured Content</Term> you add (videos, reels, audio, images,
          and portfolio links) are how other creators decide whether to start a
          Block with you. You retain ownership of everything you post.
        </P>
        <P>
          By adding Featured Content or other materials, you grant WrytrsBlock a
          non-exclusive, worldwide, royalty-free license to host, display, and
          reproduce that content solely to operate, promote, and improve the
          platform — for example, showing your work on your profile and in
          discovery. This license ends when you remove the content, except where
          it has already been shared into a Block with other members.
        </P>
        <P>
          You are responsible for the content you post. You must have the rights
          to everything you upload or link, and it must comply with our
          Community Guidelines.
        </P>
      </Section>

      <Section n={4} title="Blocks: how collaboration works">
        <P>
          A <Term>Block</Term> is a shared workspace for a piece of work.
          Communication on WrytrsBlock happens inside Blocks — there is no open
          messaging before a Block exists. To start working with someone, you
          send a <Term>Block Request</Term>; collaboration begins only once it is
          accepted. WrytrsBlock supports three Block types:
        </P>
        <Bullets
          items={[
            <>
              <Term>Collaboration Blocks</Term> — two or more creators building a
              creative project together.
            </>,
            <>
              <Term>Service Blocks</Term> — one creator hiring another to deliver
              defined work, or a creator offering a service that others can book.
            </>,
            <>
              <Term>Block Parties</Term> — live events such as listening
              sessions, workshops, Q&amp;As, livestreams, and networking rooms.
            </>,
          ]}
        />
        <P>
          You are responsible for the commitments you make inside a Block,
          including agreed deliverables, timelines, and conduct. WrytrsBlock
          provides the tools but is not a party to the agreements between
          creators.
        </P>
      </Section>

      <Section n={5} title="Service Blocks, payments, and fees">
        <P>
          <Term>Service Blocks</Term> may involve payment between creators.
          Payments are processed by third-party providers (such as Stripe or
          PayPal), and your use of those services is subject to their terms.
          WrytrsBlock may charge platform or processing fees, which will be
          disclosed before you complete a transaction.
        </P>
        <Bullets
          items={[
            "You are responsible for delivering the work you agree to in a Service Block, and for paying for work you commission.",
            "Refunds, disputes, and cancellations are handled between the creators involved; WrytrsBlock may assist but is not obligated to issue refunds.",
            "You are responsible for any taxes arising from your activity on the platform.",
          ]}
        />
        <P>
          <Term>Future monetization.</Term> Paid features — such as paid Service
          Blocks, ticketed Block Parties, tips, or other monetization — are being
          developed and may not be fully available yet, may change, and may not
          be offered in every region. We will make any applicable fees and terms
          clear before you use a paid feature. Nothing here is a promise of
          future earnings.
        </P>
      </Section>

      <Section n={6} title="Ownership, credit, and Split Sheets">
        <P>
          You and your collaborators own the work you create together. A Block
          may include a <Term>Split Sheet</Term> to record how ownership,
          credit, and revenue are divided. A Split Sheet is a record of your
          agreement with one another — it is your responsibility to ensure it is
          accurate and honored. WrytrsBlock does not adjudicate ownership
          disputes.
        </P>
      </Section>

      <Section n={7} title="Block Score and discovery">
        <P>
          <Term>Block Score</Term> is a reputation signal earned through
          completed Blocks, ratings, and reliable collaboration. It helps
          surface trustworthy creators in the Block Market. We may adjust how
          Block Score and discovery work over time. You may not manipulate Block
          Score or discovery through fake accounts, fake Blocks, or coordinated
          inauthentic activity.
        </P>
      </Section>

      <Section n={8} title="Acceptable use">
        <P>
          Your use of WrytrsBlock must follow our{" "}
          <a
            href="/community-guidelines"
            className="text-accent hover:underline"
          >
            Community Guidelines
          </a>
          . You agree not to misuse the platform, including by posting unlawful
          or infringing content, harassing other creators, scamming, scraping
          data, or interfering with the platform&apos;s operation or security.
        </P>
      </Section>

      <Section n={9} title="Intellectual property of WrytrsBlock">
        <P>
          The WrytrsBlock name, logo, the term &ldquo;Block,&rdquo; and the
          platform&apos;s software, design, and features are owned by WrytrsBlock
          and protected by intellectual property laws. These Terms do not grant
          you any rights to our brand or technology beyond using the platform as
          intended.
        </P>
      </Section>

      <Section n={10} title="Suspension and termination">
        <P>
          You may stop using WrytrsBlock at any time and may delete your account
          from Settings. We may suspend or terminate accounts that violate these
          Terms or our Community Guidelines, that create risk for other
          creators, or as required by law. Some content may remain in shared
          Blocks after you leave, so that your collaborators retain their
          records.
        </P>
      </Section>

      <Section n={11} title="Disclaimers">
        <P>
          WrytrsBlock is provided &ldquo;as is&rdquo; and &ldquo;as
          available.&rdquo; We do not guarantee that creators will deliver,
          that collaborations will succeed, or that the platform will be
          uninterrupted or error-free. You are responsible for vetting the
          creators you work with.
        </P>
      </Section>

      <Section n={12} title="Limitation of liability">
        <P>
          To the maximum extent permitted by law, WrytrsBlock is not liable for
          indirect, incidental, or consequential damages, or for disputes,
          losses, or unpaid amounts arising between creators. Our total
          liability for any claim relating to the platform is limited to the
          greater of the fees you paid us in the prior twelve months or USD 100.
        </P>
      </Section>

      <Section n={13} title="Changes to these Terms">
        <P>
          We may update these Terms as WrytrsBlock evolves. When we make
          material changes, we will update the date above and, where
          appropriate, notify you in the product. Continuing to use WrytrsBlock
          after changes take effect means you accept the updated Terms.
        </P>
      </Section>

      <Section n={14} title="Contact us">
        <P>
          Questions about these Terms? Email us at{" "}
          <a
            href="mailto:support@wrytrsblock.com"
            className="text-accent hover:underline"
          >
            support@wrytrsblock.com
          </a>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
