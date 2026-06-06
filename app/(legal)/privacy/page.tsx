import type { Metadata } from "next";
import { LegalPage, Section, P, Bullets, Term } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · WrytrsBlock",
  description:
    "How WrytrsBlock collects, uses, and protects your information — your Creator Profile, Featured Content, Blocks, messages, and account data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      category="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains what information WrytrsBlock collects, how we use it, who we share it with, and the choices you have. It applies to your Creator Profile, Featured Content, Blocks, messages, and account activity on the platform."
      updated="June 6, 2026"
    >
      <Section n={1} title="Who we are">
        <P>
          WrytrsBlock, part of THE CR8TV COLLECTV, is a creator collaboration
          platform. This policy describes our practices for the WrytrsBlock
          website and app. We aim to collect only what we need to help creators
          discover one another and collaborate through <Term>Blocks</Term>.
        </P>
      </Section>

      <Section n={2} title="Information we collect">
        <Bullets
          items={[
            <>
              <Term>Account data</Term> — your name, email address, and password
              (your password is managed by our authentication provider and is
              never stored by us in plain text).
            </>,
            <>
              <Term>Creator Profile</Term> — your handle, creator types, genres,
              location, bio, availability, Block Score, and the links you add.
            </>,
            <>
              <Term>Featured Content</Term> — the videos, reels, audio, images,
              YouTube links, and portfolio links you add to showcase your work.
            </>,
            <>
              <Term>Block activity</Term> — the <Term>Block Requests</Term> you
              send or receive, and the <Term>Collaboration Blocks</Term>,{" "}
              <Term>Service Blocks</Term>, and <Term>Block Parties</Term> you
              create or join, including deliverables and Split Sheets.
            </>,
            <>
              <Term>Messages inside accepted Blocks</Term> — the messages and
              files you exchange with other members once a Block is active.
            </>,
            <>
              <Term>Notification preferences</Term> — the settings you choose for
              Block Requests, invitations, Block Parties, marketplace activity,
              and email.
            </>,
            <>
              <Term>Transaction data</Term> — when monetization is enabled and
              you pay or get paid through a Service Block or Block Party, our
              payment processor collects payment details; we receive only limited
              confirmation data, not your full card information.
            </>,
            <>
              <Term>Usage and device data</Term> — basic log, device, and
              interaction data used to operate, secure, and improve the platform.
            </>,
          ]}
        />
      </Section>

      <Section n={3} title="How we use your information">
        <Bullets
          items={[
            "Operate your account, Creator Profile, and Featured Content.",
            "Power discovery in the Block Market and compute your Block Score.",
            "Enable Block Requests, Collaboration Blocks, Service Blocks, and Block Parties, including messaging inside accepted Blocks.",
            "Process payments and prevent fraud or abuse.",
            "Send you the notifications you have enabled, and important account or legal updates.",
            "Maintain the security, integrity, and reliability of the platform.",
          ]}
        />
      </Section>

      <Section n={4} title="What is public, and what is not">
        <P>
          Your <Term>Creator Profile</Term> and <Term>Featured Content</Term>{" "}
          are designed to be discoverable so other creators can decide whether
          to start a Block with you. You control much of this from your privacy
          settings — for example, whether your profile is publicly discoverable
          and whether your location is shown.
        </P>
        <P>
          <Term>Messages and files inside a Block</Term> are visible only to the
          members of that Block. There is no open messaging before a Block
          Request is accepted. We do not sell your personal information.
        </P>
      </Section>

      <Section n={5} title="How we share information">
        <Bullets
          items={[
            <>
              <Term>With other creators</Term> — when you send a Block Request or
              join a Block, the relevant members can see your profile and what
              you share inside that Block.
            </>,
            <>
              <Term>With service providers</Term> — the vendors that run our
              infrastructure (see &ldquo;Service providers and
              infrastructure&rdquo; below), acting on our instructions.
            </>,
            <>
              <Term>For legal reasons</Term> — when required by law, or to
              protect the rights, safety, and security of creators and the
              platform.
            </>,
            <>
              <Term>In a business transfer</Term> — if WrytrsBlock is involved in
              a merger, acquisition, or sale of assets, subject to this policy.
            </>,
          ]}
        />
      </Section>

      <Section n={6} title="Service providers and infrastructure">
        <P>
          We rely on a small number of trusted providers to run WrytrsBlock.
          They process information only to provide their services to us:
        </P>
        <Bullets
          items={[
            <>
              <Term>Supabase</Term> — our database, authentication, and file
              storage. Your account, Creator Profile, Featured Content, Blocks,
              and messages are stored in Supabase, and your sign-in is handled by
              Supabase Auth (we never see your password in plain text).
            </>,
            <>
              <Term>Vercel</Term> — hosting and content delivery for the
              WrytrsBlock website and app, including standard server logs.
            </>,
            <>
              <Term>Payment processors</Term> — when monetization is enabled
              (e.g., paid Service Blocks or Block Parties), a processor such as
              Stripe or PayPal handles payment details under its own terms.
            </>,
            "Email delivery providers, used to send account, notification, and support messages.",
          ]}
        />
        <P>
          These providers may store and process data in the United States and
          other regions. We share only what each provider needs to operate the
          platform.
        </P>
      </Section>

      <Section n={7} title="Cookies and analytics">
        <P>
          WrytrsBlock uses cookies and similar technologies that are essential to
          the platform — for example, to keep you signed in and to secure your
          session. These are necessary for the product to function.
        </P>
        <P>
          We may use limited, privacy-respecting analytics to understand how the
          platform is used (such as which pages load and where errors occur) so
          we can improve it. We do not sell your data, we do not use it for
          third-party advertising, and we do not run an ad network on
          WrytrsBlock.
        </P>
      </Section>

      <Section n={8} title="Your choices and controls">
        <P>You can manage much of your privacy directly in WrytrsBlock:</P>
        <Bullets
          items={[
            "Edit or remove your Creator Profile and Featured Content at any time.",
            "Control public discovery and whether your location is shown in Privacy settings.",
            "Choose which notifications you receive, including email notifications.",
            "Delete your account from Settings; some content may remain in shared Blocks so your collaborators keep their records.",
            "Request a copy of your data, or ask us to correct or delete it, by contacting support.",
          ]}
        />
      </Section>

      <Section n={9} title="Data retention">
        <P>
          We keep your information for as long as your account is active or as
          needed to provide the platform. After you delete your account, we
          remove or de-identify your personal information within a reasonable
          period, except where we must retain it for legal, security, or
          dispute-resolution purposes, or where it forms part of a shared Block.
        </P>
      </Section>

      <Section n={10} title="Security">
        <P>
          We use technical and organizational measures to protect your
          information, including encrypted connections and access controls
          enforced at the database level. No system is perfectly secure, so we
          cannot guarantee absolute security — please use a strong, unique
          password and keep it confidential.
        </P>
      </Section>

      <Section n={11} title="Children's privacy">
        <P>
          WrytrsBlock is not directed to children under 16, and we do not
          knowingly collect their information. If you believe a minor has
          provided us information, contact us and we will take appropriate
          steps.
        </P>
      </Section>

      <Section n={12} title="International users">
        <P>
          WrytrsBlock may process and store information in countries other than
          where you live, including through Supabase and Vercel. Where we
          transfer information, we take steps to protect it consistent with this
          policy and applicable law.
        </P>
      </Section>

      <Section n={13} title="Changes to this policy">
        <P>
          We may update this Privacy Policy as the platform evolves. When we make
          material changes, we will update the date above and, where
          appropriate, notify you in the product.
        </P>
      </Section>

      <Section n={14} title="Contact and support">
        <P>
          Questions or privacy requests? Email{" "}
          <a
            href="mailto:privacy@wrytrsblock.com"
            className="text-accent hover:underline"
          >
            privacy@wrytrsblock.com
          </a>{" "}
          or{" "}
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
