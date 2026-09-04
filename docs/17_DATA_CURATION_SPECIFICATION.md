# DATA CURATION SPECIFICATION

This document establishes the official Data Curation Contract for the 1learn.asia platform. It dictates the rules for verifying, importing, and publishing data within the Data Backbone (Careers, Majors, Universities, and their mappings). 

## 1. Provenance Fields Definition

Every record within the Data Backbone entities must support the following provenance fields to track data origin and verification status:

- `source`: (TEXT) A standardized string indicating the origin system, organization, or document (e.g., "O*NET 28.0", "MOET Danh mục 2022", "HCMUT Đề án tuyển sinh 2024").
- `source_url`: (TEXT) A direct, clickable URL linking to the exact page or document where the source data can be found.
- `last_verified_at`: (TIMESTAMPTZ) The timestamp of when the data was last checked against its source by a human curator.
- `verified_by`: (UUID) The ID of the authenticated admin/curator user who performed the verification.

## 2. Meaning of Provenance Fields

- **Data Integrity**: These fields answer the question "Why should a student trust this information?".
- **Auditability**: They allow other curators to periodically revisit the `source_url` to see if the original data has changed (e.g., admission scores updated).
- **Accountability**: `verified_by` ensures that someone takes responsibility for the correctness of the data before it is exposed to the public.

## 3. Source Verification Rules

1. **No Hallucination**: You must NOT guess or automatically infer the `source` or `source_url` based on the name of a career or university. If you do not have the exact source link, the field must remain NULL.
2. **Authoritative Sources Only**: Use official sources where possible (e.g., `.gov` domains, official university websites, Ministry of Education documents). Do not use third-party aggregator sites (e.g., Wikipedia) as primary sources for critical admission data.
3. **Traceability**: The `source_url` must point to a page that contains the specific data point (e.g., the specific PDF for admission scores), not just a homepage (e.g., `https://hcmut.edu.vn`).

## 4. Lifecycle Transitions (draft → published)

A record is ONLY allowed to transition to `published` if it meets the **Publication Requirements**:
1. It has all mandatory core fields filled (e.g., `name`, `code`).
2. It has valid provenance metadata (`source`, `source_url` must not be null/empty).
3. It has been reviewed by a human (indicated by a non-null `verified_by` and `last_verified_at`).

## 5. When to keep as `draft`

A record MUST remain in `draft` if:
1. It is newly created or imported via a bulk script and hasn't been reviewed.
2. The curator cannot find a reliable `source_url`.
3. It is a parent record (like University) but is missing critical information required by the schema.
4. The record was previously published but the source URL is now dead (404) and no replacement can be found (should be reverted to draft or archived).

## 6. Publication Dependency Rules (Integrity)

Publication of child records is strictly gated by the publication status of their parent records:

1. **Admission Data**: An `admission_data` record CANNOT be `published` if its parent `university_major` is `draft` or `archived`.
2. **University Major**: A `university_major` record CANNOT be `published` if either the associated `university` or `major` is not `published`.
3. **Career-Major Mapping**: A `career_major_mapping` record CANNOT be `published` if either the associated `career` or `major` is not `published`.
4. **Cascading Un-publish**: If a parent entity (e.g., a Major) is downgraded to `draft`, the system or curator MUST also downgrade all dependent child records (Mappings, University Majors) to prevent dangling references in production.

## 7. Human Curator Workflow

The exact sequence a human curator must follow:

1. **DISCOVER**: Identify records currently in `draft` or those flagged as missing provenance.
2. **VERIFY**: Research the entity, locate the authoritative information on the internet or official documents.
3. **ENTER SOURCE**: Fill in the `source` and `source_url` fields accurately based on the findings.
4. **REVIEW**: Confirm the core fields (name, description, etc.) match the source. The system stamps `last_verified_at` and `verified_by`.
5. **PUBLISH**: Change the status to `published`, making it visible to the student frontend.

## 8. Anti-Hallucination Mandate

Under no circumstances should AI agents, bulk import scripts, or human curators generate synthetic sources (e.g., entering "Internet" or "Google Search") just to bypass the publication gate. Provenance debt is preferable to fake provenance. 

## 9. Audit Requirements

The system must run periodic audits (e.g., `scripts/audit-data-backbone.ts`) to ensure:
- Zero records are `published` without `source`/`source_url`.
- Zero child records are `published` while pointing to an unpublished parent.

## 10. Handling Unverifiable Data

If a record cannot be verified (e.g., an outdated major code that no longer exists):
- It remains in `draft`.
- If it has been in `draft` for a prolonged period without verification, it may be moved to `archived`.
- Do NOT delete the record if it is referenced by other historical data, use `archived` instead.

## 11. Bulk Import Rules

When writing scripts to bulk import data (e.g., from CSVs):
1. **Default to Draft**: All imported records must default to `status = 'draft'`.
2. **No Auto-Publish**: Scripts must never set `status = 'published'` unless the import payload explicitly contains pre-verified `source` and `source_url` fields, AND the script is explicitly authorized to bypass manual review.
3. **Provenance is Mandatory**: If the script is authorized to publish, the source data must provide `source` and `source_url`.
4. **Pre-commit Validation**: The script must dry-run and validate foreign keys and enumerations before executing `COMMIT`.

## 12. Entity-Specific Requirements

- **Career**: Must cite official occupational databases (e.g., O*NET, BLS).
- **Major**: Must cite the MOET standard training nomenclature.
- **University**: Must cite MOET university lists or the university's official homepage.
- **University Major**: Must cite the specific university's admission scheme (Đề án tuyển sinh).
- **Admission Data**: Must cite the official admission cutoff announcement for the specific `academic_year`.
- **Career-Major Mapping**: Must cite the source that establishes the link (e.g., university career counseling pages or established mapping frameworks).
