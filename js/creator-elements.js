// ======================= CREATOR ELEMENTS =======================
"use strict";
const $ = (id) => document.getElementById(id);

const els = {
  btnModeToggle:        $("btn-mode-toggle"),
  modeLabel:            $("mode-label"),
  apiKeyBar:            $("api-key-bar"),
  inputApiKey:          $("input-api-key"),
  btnKeyConfirm:        $("btn-key-confirm"),
  aiActions:            $("ai-actions"),
  aiStoryHint:          $("ai-story-hint"),
  btnAiGenerate:        $("btn-ai-generate"),
  segmentList:          $("segment-list"),
  btnAddSegment:        $("btn-add-segment"),
  inputTitle:           $("input-title"),
  inputDifficulty:      $("input-difficulty"),
  inputSource:          $("input-source"),
  inputHeroPhoto:       $("input-hero-photo"),
  inputKeywords:        $("input-keywords"),
  inputIntro:           $("input-intro"),
  introCount:           $("intro-count"),
  inputTips:            $("input-tips"),
  inputRouteId:         $("input-route-id"),
  inputStatus:          $("input-status"),
  btnExport:            $("btn-export"),
  jsonImportInput:      $("json-import-input"),
  blockList:            $("block-list"),
  btnAddTextBlock:      $("btn-add-text-block"),
  btnAddPhotoBlock:     $("btn-add-photo-block"),
  btnAddPhotoGridBlock: $("btn-add-photo-grid-block"),
  btnAddLinkBlock:      $("btn-add-link-block"),
  galleryList:          $("gallery-list"),
  btnAddGalleryPhoto:   $("btn-add-gallery-photo"),
};

window.$ = $;
window.els = els;
