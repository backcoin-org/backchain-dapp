// @backchain/sdk — TypeScript Types
// ============================================================================
export const TierNames = ['Bronze', 'Silver', 'Gold', 'Diamond'];
export const TierBoosts = [1000, 2500, 4000, 5000]; // BPS
// ── Notary ──────────────────────────────────────────────────────────────────
export var DocType;
(function (DocType) {
    DocType[DocType["General"] = 0] = "General";
    DocType[DocType["Contract"] = 1] = "Contract";
    DocType[DocType["Identity"] = 2] = "Identity";
    DocType[DocType["Diploma"] = 3] = "Diploma";
    DocType[DocType["Property"] = 4] = "Property";
    DocType[DocType["Financial"] = 5] = "Financial";
    DocType[DocType["Legal"] = 6] = "Legal";
    DocType[DocType["Medical"] = 7] = "Medical";
    DocType[DocType["IP"] = 8] = "IP";
    DocType[DocType["Other"] = 9] = "Other";
})(DocType || (DocType = {}));
// ── Charity ─────────────────────────────────────────────────────────────────
export var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus[CampaignStatus["Active"] = 0] = "Active";
    CampaignStatus[CampaignStatus["Closed"] = 1] = "Closed";
    CampaignStatus[CampaignStatus["Withdrawn"] = 2] = "Withdrawn";
})(CampaignStatus || (CampaignStatus = {}));
// ── Agora (Social) ──────────────────────────────────────────────────────────
export var ContentType;
(function (ContentType) {
    ContentType[ContentType["Text"] = 0] = "Text";
    ContentType[ContentType["Image"] = 1] = "Image";
    ContentType[ContentType["Video"] = 2] = "Video";
    ContentType[ContentType["Link"] = 3] = "Link";
    ContentType[ContentType["Live"] = 4] = "Live";
})(ContentType || (ContentType = {}));
export var BadgeTier;
(function (BadgeTier) {
    BadgeTier[BadgeTier["Verified"] = 0] = "Verified";
    BadgeTier[BadgeTier["Premium"] = 1] = "Premium";
    BadgeTier[BadgeTier["Elite"] = 2] = "Elite";
})(BadgeTier || (BadgeTier = {}));
//# sourceMappingURL=index.js.map