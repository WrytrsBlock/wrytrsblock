import type { Metadata } from "next";
import { LegalPage, Section, P, Bullets, Term } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · WrytrsBlock",
  description:
    "How WrytrsBlock collects, uses, and protects your information — your Creator Profile, Featured Content, Blocks, and account data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      category="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains what information WrytrsBlock collects, how we use it, and the choices you have. It applies to your Creator Profile, Featured Content, Blocks, and account activity on the platform."
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
              <Term>Account information</Term> — your name, email address, and
              password (passwords are handled by our authentication provider and
              are never stored by us in plain text).
            </>,
            <>
              <Term>Creator Profile</Term> — your handle, creator types, genres,
              location, bio, availability, and links you choose to add.
            </>,
            <>
              <Term>Featured Content</Term> — the videos, reels, audio, images,
              and portfolio links you add to showcase your work.
            </>,
            <>
              <Term>Block activity</Term> — Block Requests, Blocks you join,
              messages within your Blocks, deliverables, and Split Sheets.
            </>,
            <>
              <Term>Transaction information</Term> — when you pay or get paid
              through a Service Block or Block Party, our payment processors
              collect and process payment details; we receive limited
              confirmation data, not your full card information.
            </>,
            <>
              <Term>Usage information</Term> — basic device, log, and
              interaction data used to operate and improve the platform.
            </>,
          ]}
        />
      </Section>

      <Section n={3} title="How we use your information">
        <Bullets
          items={[
            "Operate your account, Creator Profile, and Featured Content.",
            "Power discovery in the Block Market and compute your Block Score.",
            "Enable Block Requests, Blocks, Service Blocks, and Block Parties, including messaging within accepted Blocks.",
            "Process payments and prevent fraud or abuse.",
            "Send you notifications you have enabled, and important account or legal updates.",
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
          Messages and files inside a Block are visible only to the members of
          that Block. We do not sell your personal information.
        </P>
      </Section>

      <Section n={5} title="How we share information">
        <Bullets
          items={[
            <>
              <Term>With other creators</Term> — when you send a Block Request or
              join a Block, the relevant members can see your profile and what
              you share in that Block.
            </>,
            <>
              <Term>With service providers</Term> — vendors that host our
              infrastructure, store media, send email, and process payments,
              acting on our instructions.
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

      <Section n={6} title="Your choices and controls">
        <P>
          You can manage much of your privacy directly in WrytrsBlock:
        </P>
        <Bullets
          items={[
            "Edit or remove your Creator Profile and Featured Content at any time.",
            "Control public discovery and whether your location is shown in Privacy settings.",
            "Choose which notifications you receive, including email notifications.",
            "Delete your account from Settings; some content may remain in shared Blocks so collaborators keep their records.",
          ]}
        />
      </Section>

      <Section n={7} title="Data retention">
        <P>
          We keep your information for as long as your account is active or as
          needed to provide the platform. After you delete your account, we
          remove or de-identify your personal information within a reasonable
          period, except where we must retain it for legal, security, or
          dispute-resolution purposes, or where it forms part of a shared Block.
        </P>
      </Section>

      <Section n={8} title="Security">
        <P>
          We use technical and organizational measures to protect your
          information, including encrypted connections and access controls. No
          system is perfectly secure, so we cannot guarantee absolute security —
          please use a strong, unique password and keep it confidential.
        </P>
      </Section>

      <Section n={9} title="Children's privacy">
        <P>
          WrytrsBlock is not directed to children under 16, and we do not
          knowingly collect their information. If you believe a minor has
          provided us information, contact us and we will take appropriate
          steps.
        </P>
      </Section>

      <Section n={10} title="International users">
        <P>
          WrytrsBlock may process and store information in countries other than
          where you live. Where we transfer information, we take steps to protect
          it consistent with this policy and applicable law.
        </P>
      </Section>

      <Section n={11} title="Changes to this policy">
        <P>
          We may update this Privacy Policy as the platform evolves. When we make
          material changes, we will update the date above and, where
          appropriate, notify you in the product.
        </P>
      </Section>

      <Section n={12} title="Contact us">
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
