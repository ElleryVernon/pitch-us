-- CreateTable
CREATE TABLE "presentations" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "n_slides" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "document_content" TEXT,
    "file_metadata" TEXT,
    "tone" TEXT,
    "verbosity" TEXT,
    "instructions" TEXT,
    "include_table_of_contents" BOOLEAN NOT NULL DEFAULT false,
    "include_title_slide" BOOLEAN NOT NULL DEFAULT true,
    "web_search" BOOLEAN NOT NULL DEFAULT false,
    "outlines" TEXT,
    "layout" TEXT,
    "structure" TEXT,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "layout_group" TEXT,
    "layout" TEXT,
    "slide_index" INTEGER NOT NULL,
    "speaker_note" TEXT,
    "content" TEXT,
    "html_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_assets" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "is_uploaded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ordered" BOOLEAN NOT NULL DEFAULT false,
    "slides" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentation_layout_codes" (
    "id" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "layout_name" TEXT NOT NULL,
    "layout_code" TEXT NOT NULL,
    "fonts" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presentation_layout_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "presentations_created_at_idx" ON "presentations"("created_at");

-- CreateIndex
CREATE INDEX "slides_presentation_idx" ON "slides"("presentation");

-- CreateIndex
CREATE INDEX "slides_presentation_slide_index_idx" ON "slides"("presentation", "slide_index");

-- CreateIndex
CREATE INDEX "image_assets_is_uploaded_created_at_idx" ON "image_assets"("is_uploaded", "created_at" DESC);

-- CreateIndex
CREATE INDEX "presentation_layout_codes_presentation_idx" ON "presentation_layout_codes"("presentation");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_url_idx" ON "webhook_subscriptions"("url");

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_presentation_fkey" FOREIGN KEY ("presentation") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentation_layout_codes" ADD CONSTRAINT "presentation_layout_codes_presentation_fkey" FOREIGN KEY ("presentation") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
