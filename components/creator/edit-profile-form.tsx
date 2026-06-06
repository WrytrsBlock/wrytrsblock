"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
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
  // Featured Content — curated showcase items
  const [featured, setFeatured] = useState<FeaturedContentItem[]>(
    initial.featuredContent
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (
    list: string[],
    set: (v: string[]) => void,
    id: string
  ) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function onBannerFile(file: File) {
    setBannerError(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setBannerError(invalid);
      return;
    }

    setBannerUploading(true);
    try {
      const url = await uploadToAvatars(file, "banner");
      if (url) setBanner(url);
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
    const res = await updateCreatorProfileAction({
      bio,
      country,
      city,
      creatorTypes,
      genres,
      lookingFor,
      availability,
      avatarUrl: avatar,
      bannerUrl: banner,
      featuredContent: featured,
    });
    setSaving(false);
    if (res.ok) {
      router.push(`/profile/${res.handle ?? initial.handle}`);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[680px] px-5 md:px-8 py-7 space-y-6 animate-fade-up">
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

        {/* Banner */}
        <Field label="Cover image">
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            className="relative block w-full h-32 rounded-2xl overflow-hidden border border-line bg-surface-2 group"
          >
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 bg-grad-accent opacity-80" />
            )}
            <span className="absolute inset-0 flex items-center justify-center gap-2 text-white text-[12.5px] font-medium bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlus size={15} />
              {bannerUploading ? "Uploading…" : "Change cover"}
            </span>
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
              {IMAGE_FORMATS_HINT}
            </p>
          )}
        </Field>

        {/* Avatar */}
        <Field label="Profile photo">
          <PhotoPicker value={avatar} name={initial.handle} onChange={setAvatar} />
        </Field>

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

        {/* Featured Content — the curated showcase shown high on the profile */}
        <div id="featured" className="scroll-mt-20">
          <Field label="Featured Content">
            <FeaturedContentEditor value={featured} onChange={setFeatured} />
            <p className="mt-2 text-[11px] text-muted/70">
              Add videos, reels, audio, images, or portfolio links. Choose one
              ⭐ Featured item — it shows first and larger on your profile.
            </p>
          </Field>
        </div>

        {error && (
          <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
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
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(`/profile/${initial.handle}`)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
