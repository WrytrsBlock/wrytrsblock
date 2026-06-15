"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";
import { Chip, Field, PhotoPicker } from "@/components/onboarding/primitives";
import {
  IMAGE_ACCEPT,
  IMAGE_FORMATS_HINT,
  uploadToAvatars,
  validateImageFile,
} from "@/lib/upload-image";
import { FeaturedContentEditor } from "@/components/creator/featured-content-editor";
import { updateCreatorProfileAction } from "@/app/actions/creators";
import {
  AVAILABILITY,
  BIO_MAX,
  CREATOR_TYPES,
  INTERESTS,
  LOOKING_FOR,
} from "@/lib/onboarding";
import type { EditableCreatorProfile } from "@/lib/data";
import type { FeaturedContentItem } from "@/types";

export function EditProfileForm({
  initial,
}: {
  initial: EditableCreatorProfile;
}) {
  const router = useRouter();
  const bannerInput = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(initial.bio);
  const [avatar, setAvatar] = useState<string | null>(initial.avatarUrl);
  const [banner, setBanner] = useState<string | null>(initial.bannerUrl);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  // True briefly after a successful cover upload (confirmation cue).
  const [bannerSaved, setBannerSaved] = useState(false);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [creatorTypes, setCreatorTypes] = useState<string[]>(
    initial.creatorTypes
  );
  const [genres, setGenres] = useState<string[]>(initial.genres);
  const [lookingFor, setLookingFor] = useState<string[]>(initial.lookingFor);
  const [availability, setAvailability] = useState<string[]>(
    initial.availability
  );
  // Identity
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.handle);
  const [website, setWebsite] = useState(initial.website);
  // Social links
  const [instagram, setInstagram] = useState(initial.socials.instagram ?? "");
  const [youtube, setYoutube] = useState(initial.socials.youtube ?? "");
  const [spotify, setSpotify] = useState(initial.socials.spotify ?? "");
  const [tiktok, setTiktok] = useState(initial.socials.tiktok ?? "");
  const [linkedin, setLinkedin] = useState(initial.socials.linkedin ?? "");
  // Block Showcase — curated showcase items
  const [featured, setFeatured] = useState<FeaturedContentItem[]>(
    initial.featuredContent
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Success confirmation + a non-blocking notice (e.g. Featured Content couldn't
  // be saved because its migration isn't applied yet — the photo/cover still
  // saved). `savedHandle` is the destination to view the persisted profile.
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedHandle, setSavedHandle] = useState<string | null>(null);

  // Arriving via "Add Featured Content" (/profile/edit#featured): scroll
  // straight to the Featured Content section. The form lives inside a nested
  // overflow-y-auto container, so the browser's default hash scroll can't reach
  // it — we bring it into view explicitly.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#featured")
      return;
    const t = setTimeout(() => {
      document
        .getElementById("featured")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const toggle = (
    list: string[],
    set: (v: string[]) => void,
    id: string
  ) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function onBannerFile(file: File) {
    setBannerError(null);
    setBannerSaved(false);

    const invalid = validateImageFile(file);
    if (invalid) {
      setBannerError(invalid);
      return;
    }

    setBannerUploading(true);
    try {
      const url = await uploadToAvatars(file, "banner");
      // Only reflect the new cover if the upload actually returned a URL — never
      // pretend the image changed when it didn't persist to storage.
      if (url) {
        setBanner(url);
        setBannerSaved(true);
        window.setTimeout(() => setBannerSaved(false), 2400);
      } else {
        setBannerError("Upload didn't complete. Please try again.");
      }
    } catch (e) {
      console.error("Banner upload failed:", e);
      setBannerError(
        e instanceof Error ? e.message : "Upload failed. Please try again."
      );
    } finally {
      setBannerUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    setSaved(false);
    const res = await updateCreatorProfileAction({
      bio,
      country,
      city,
      creatorTypes,
      genres,
      lookingFor,
      availability,
      displayName,
      handle: username,
      website,
      socials: { instagram, youtube, spotify, tiktok, linkedin },
      avatarUrl: avatar,
      bannerUrl: banner,
      featuredContent: featured,
    });
    setSaving(false);
    if (res.ok) {
      const dest = `/profile/${res.handle ?? initial.handle}`;
      if (res.warning) {
        // Core fields (photo/cover/bio) persisted, but something secondary
        // didn't. Stay on the page so the user actually reads the notice; they
        // can tap "View profile" to confirm the image saved.
        setSaved(true);
        setNotice(res.warning);
        setSavedHandle(dest);
      } else {
        router.push(dest);
        router.refresh();
      }
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8 py-7 space-y-6 animate-fade-up">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/profile/${initial.handle}`)}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Back to profile
          </button>
          <h1 className="font-display text-2xl text-ink tracking-tight">
            Edit profile
          </h1>
        </div>

        {/* Top: images (left) + identity (right) on desktop; stacked on mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          {/* LEFT — cover, profile photo, upload controls */}
          <div className="space-y-6">
        {/* Cover image — the large image shown at the top of the profile. */}
        <Field label="Cover image">
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            className="relative block w-full h-36 rounded-2xl overflow-hidden border border-line bg-surface-2 group"
          >
            {banner ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {/* Hover affordance once a cover exists. */}
                <span className="absolute inset-0 flex items-center justify-center gap-2 text-white text-[12.5px] font-medium bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus size={15} />
                  {bannerUploading ? "Uploading…" : "Change cover image"}
                </span>
              </>
            ) : (
              // Persistent, obvious prompt when there's no cover yet.
              <span className="absolute inset-0 bg-grad-accent opacity-90 flex flex-col items-center justify-center gap-1.5 text-white">
                <ImagePlus size={20} strokeWidth={1.75} />
                <span className="text-[12.5px] font-semibold">
                  {bannerUploading ? "Uploading…" : "Upload cover image"}
                </span>
                <span className="text-[10.5px] text-white/75">
                  Make your profile stand out
                </span>
              </span>
            )}

            {/* Loading overlay while the file uploads to storage. */}
            {bannerUploading && (
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-white text-[12.5px] font-medium">
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </span>
            )}
            {/* Success cue — confirms the cover actually saved to storage. */}
            {bannerSaved && !bannerUploading && (
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-success/35 text-white text-[12.5px] font-semibold">
                <CheckCircle2 size={16} /> Cover uploaded
              </span>
            )}
          </button>
          <input
            ref={bannerInput}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onBannerFile(f);
              e.target.value = "";
            }}
          />
          {bannerError ? (
            <p className="mt-1.5 text-[11.5px] text-danger">{bannerError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted/70">
              Appears large across the top of your profile. {IMAGE_FORMATS_HINT}
            </p>
          )}
        </Field>

        {/* Profile photo — the creator's identity avatar. Distinct from the
            cover image: it's the small image used across the app, and it backs
            the hero when no cover image has been added. */}
        <Field label="Profile photo">
          <PhotoPicker value={avatar} name={initial.handle} onChange={setAvatar} />
          <p className="mt-1.5 text-[11px] text-muted/70">
            Appears in the sidebar, on Block Market cards, and in notifications —
            and fills your profile hero if you haven&rsquo;t added a cover image.
          </p>
        </Field>
          </div>

          {/* RIGHT — display name, username, bio, country, city */}
          <div className="space-y-5">
        {/* Identity — display name + username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Display name">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Username" hint="your profile URL">
            <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent/50 transition-colors">
              <span className="pl-3 text-[13px] text-muted">@</span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
                  )
                }
                placeholder="username"
                className="flex-1 bg-transparent px-1.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </div>
          </Field>
        </div>

        {/* Bio */}
        <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            rows={3}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What do you make? Who do you want to build with?"
            className="w-full rounded-lg bg-surface-2 border border-line text-ink text-[13px] leading-relaxed px-3 py-2.5 placeholder:text-muted/70 focus:outline-none focus:border-accent/50 focus:bg-surface transition-colors resize-none"
          />
        </Field>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Country">
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Canada"
            />
          </Field>
          <Field label="City">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Toronto"
            />
          </Field>
        </div>
          </div>
        </div>

        {/* Full-width longer sections below the two-column header */}
        <div className="space-y-6">
        {/* Creator types */}
        <Field label="Creator roles">
          <div className="flex flex-wrap gap-2">
            {CREATOR_TYPES.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={creatorTypes.includes(o.id)}
                onClick={() => toggle(creatorTypes, setCreatorTypes, o.id)}
              />
            ))}
          </div>
        </Field>

        {/* Genres */}
        <Field label="Genres / creative fields">
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={genres.includes(o.id)}
                onClick={() => toggle(genres, setGenres, o.id)}
              />
            ))}
          </div>
        </Field>

        {/* What I offer (availability) */}
        <Field label="What I offer">
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={availability.includes(o.id)}
                onClick={() => toggle(availability, setAvailability, o.id)}
              />
            ))}
          </div>
        </Field>

        {/* What I'm looking for */}
        <Field label="What I'm looking for">
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={lookingFor.includes(o.id)}
                onClick={() => toggle(lookingFor, setLookingFor, o.id)}
              />
            ))}
          </div>
        </Field>

        {/* Website */}
        <Field label="Website">
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
          />
        </Field>

        {/* Social links */}
        <Field label="Social links">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SocialInput
              label="Instagram"
              prefix="@"
              value={instagram}
              onChange={setInstagram}
              placeholder="username"
            />
            <SocialInput
              label="YouTube"
              prefix="@"
              value={youtube}
              onChange={setYoutube}
              placeholder="channel"
            />
            <SocialInput
              label="Spotify"
              value={spotify}
              onChange={setSpotify}
              placeholder="artist link or name"
            />
            <SocialInput
              label="TikTok"
              prefix="@"
              value={tiktok}
              onChange={setTiktok}
              placeholder="username"
            />
            <SocialInput
              label="LinkedIn"
              value={linkedin}
              onChange={setLinkedin}
              placeholder="profile id"
            />
          </div>
        </Field>

        {/* Block Showcase — the curated 3×3 grid shown in the profile banner */}
        <div id="featured" className="scroll-mt-20">
          <Field label="Block Showcase">
            <FeaturedContentEditor value={featured} onChange={setFeatured} />
            <p className="mt-2 text-[11px] text-muted/70">
              Photos, reels, videos, songs, beat packs, services, projects,
              releases, and testimonials — they fill your profile banner&apos;s
              3×3 grid. You can also add &amp; reorder tiles right on your
              profile.
            </p>
          </Field>
        </div>
        </div>

        {error && (
          <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Success confirmation (shown when we stay on the page after a save). */}
        {saved && (
          <p className="inline-flex items-center gap-2 text-[12.5px] text-success bg-success/10 border border-success/30 rounded-md px-3 py-2">
            <CheckCircle2 size={15} /> Profile saved.
          </p>
        )}

        {/* Non-blocking notice — e.g. photo/cover saved but Featured Content
            couldn't be (its migration isn't applied yet). */}
        {notice && (
          <p className="text-[12px] text-warning bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
            {notice}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="lg"
            onClick={save}
            disabled={saving || bannerUploading}
            className="min-w-[140px] justify-center"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && savedHandle ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                router.push(savedHandle);
                router.refresh();
              }}
            >
              View profile
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`/profile/${initial.handle}`)}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// A labelled social-link input with an optional @ prefix.
function SocialInput({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-muted">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent/50 transition-colors">
        {prefix && <span className="pl-3 text-[13px] text-muted">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:outline-none ${
            prefix ? "px-1.5" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}
