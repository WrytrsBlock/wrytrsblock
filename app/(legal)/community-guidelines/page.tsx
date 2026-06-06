import type { Metadata } from "next";
import { LegalPage, Section, P, Bullets, Term } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Community Guidelines · WrytrsBlock",
  description:
    "How creators treat each other on WrytrsBlock — collaborate in good faith, respect ownership, and keep Blocks and Block Parties safe.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      category="Community"
      title="Community Guidelines"
      intro="WrytrsBlock is a collaboration platform, not a social feed. These guidelines keep it a place where creators can discover real talent, work together in good faith, and get paid fairly. They apply everywhere on WrytrsBlock — profiles, Featured Content, Blocks, and Block Parties."
      updated="June 6, 2026"
    >
      <Section n={1} title="The spirit of WrytrsBlock">
        <P>
          Everything here exists to answer one question for the person viewing
          your profile: &ldquo;Why should I start a Block with this
          creator?&rdquo; Show real work, make real commitments, and treat
          collaborators the way you would want to be treated. Creators who do
          this build a strong <Term>Block Score</Term> and get discovered.
        </P>
      </Section>

      <Section n={2} title="Be a real creator">
        <Bullets
          items={[
            "Represent yourself honestly. Your Creator Profile and roles should reflect who you actually are and what you actually do.",
            "Post Featured Content that is yours — your performances, beats, reels, photos, or portfolio. Do not present someone else's work as your own.",
            "No impersonation, fake accounts, or bought engagement to inflate your Block Score or discovery.",
          ]}
        />
      </Section>

      <Section n={3} title="Collaborate in good faith">
        <P>
          Collaboration on WrytrsBlock starts with a <Term>Block Request</Term>{" "}
          and happens inside a <Term>Block</Term>. Once you accept or send one,
          you are making a commitment.
        </P>
        <Bullets
          items={[
            "Communicate clearly and respond within a reasonable time inside your Blocks.",
            "Deliver what you agree to in a Collaboration Block or Service Block — the scope, the deliverables, and the timeline.",
            "If plans change, say so early. Ghosting collaborators harms them and your reputation.",
          ]}
        />
      </Section>

      <Section n={4} title="Respect ownership and credit">
        <Bullets
          items={[
            <>
              Agree on ownership and revenue up front. Use the{" "}
              <Term>Split Sheet</Term> in a Block to record who owns what.
            </>,
            "Do not upload, share, or release work you do not have the rights to.",
            "Honor the credit and splits you agree to. Taking a collaborator's work or credit is a serious violation.",
          ]}
        />
      </Section>

      <Section n={5} title="Service Blocks: deliver what you sell">
        <P>
          When you offer or accept a <Term>Service Block</Term>, you are entering
          a real working agreement.
        </P>
        <Bullets
          items={[
            "Describe your services and pricing accurately, including turnaround time and revisions.",
            "Deliver the agreed work, and pay for work you commission.",
            "No scams, bait-and-switch pricing, or off-platform schemes designed to avoid accountability.",
          ]}
        />
      </Section>

      <Section n={6} title="Keep Blocks and Block Parties safe">
        <P>
          <Term>Block Parties</Term> — listening sessions, workshops, Q&amp;As,
          livestreams, and networking rooms — and every Block are professional,
          creative spaces. The following are not allowed anywhere on WrytrsBlock:
        </P>
        <Bullets
          items={[
            "Harassment, bullying, threats, or stalking of other creators.",
            "Hate speech or attacks based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.",
            "Sexual content involving minors — ever — and non-consensual or exploitative content.",
            "Violence, dangerous, or illegal activity, including the sale of illegal goods.",
            "Spam, mass unsolicited Block Requests, phishing, malware, or scraping the platform.",
          ]}
        />
      </Section>

      <Section n={7} title="Content standards">
        <P>
          Featured Content and anything you share in a Block must comply with
          these guidelines and the law. Keep self-promotion relevant and honest;
          WrytrsBlock is for showcasing work and collaborating, not for spam or
          unrelated advertising.
        </P>
      </Section>

      <Section n={8} title="Reporting and enforcement">
        <P>
          If you see something that breaks these guidelines, report it to{" "}
          <a
            href="mailto:support@wrytrsblock.com"
            className="text-accent hover:underline"
          >
            support@wrytrsblock.com
          </a>
          . Depending on severity and history, we may remove content, lower or
          reset a Block Score, limit discovery, or suspend or terminate an
          account. We prioritize the safety and trust of the creator community.
        </P>
      </Section>

      <Section n={9} title="Appeals">
        <P>
          If you believe we made a mistake, you can appeal an enforcement
          decision by replying to the notice we send or by emailing{" "}
          <a
            href="mailto:support@wrytrsblock.com"
            className="text-accent hover:underline"
          >
            support@wrytrsblock.com
          </a>
          . We will review appeals in good faith.
        </P>
      </Section>

      <Section n={10} title="Questions">
        <P>
          These guidelines work alongside our{" "}
          <a href="/terms" className="text-accent hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </a>
          . Reach us any time at{" "}
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
