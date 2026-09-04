export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      "assessment_responses": {
        Row: { "id": string; "session_id": string; "question_id": string; "response_value": number; "response_json": any | null; "answered_at": string }
        Insert: { "id": string; "session_id": string; "question_id": string; "response_value": number; "response_json": any | null; "answered_at": string }
        Update: { "id": string; "session_id": string; "question_id": string; "response_value": number; "response_json": any | null; "answered_at": string }
      }
      "task_completions": {
        Row: { "id": string; "task_id": string; "student_id": string; "completion_type": string; "evidence_text": string | null; "evidence_url": string | null; "completed_at": string; "created_at": string }
        Insert: { "id": string; "task_id": string; "student_id": string; "completion_type": string; "evidence_text": string | null; "evidence_url": string | null; "completed_at": string; "created_at": string }
        Update: { "id": string; "task_id": string; "student_id": string; "completion_type": string; "evidence_text": string | null; "evidence_url": string | null; "completed_at": string; "created_at": string }
      }
      "academic_records": {
        Row: { "id": string; "student_id": string; "subject": string; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string; "updated_at": string; "academic_year": string; "grade_level": number; "subject_code": string; "score": number | null; "max_score": number | null; "source": string; "verified_at": string | null; "verified_by": string | null }
        Insert: { "id": string; "student_id": string; "subject": string; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string; "updated_at": string; "academic_year": string; "grade_level": number; "subject_code": string; "score": number | null; "max_score": number | null; "source": string; "verified_at": string | null; "verified_by": string | null }
        Update: { "id": string; "student_id": string; "subject": string; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string; "updated_at": string; "academic_year": string; "grade_level": number; "subject_code": string; "score": number | null; "max_score": number | null; "source": string; "verified_at": string | null; "verified_by": string | null }
      }
      "career_matches": {
        Row: { "id": string; "run_id": string; "career_id": string; "rank": number; "match_score": number; "riasec_score": number | null; "ability_score": number | null; "value_score": number | null; "academic_score": number | null; "effective_weights": any; "confidence_score": number; "confidence_level": string; "evidence_coverage": number; "factors": any; "gaps": any; "required_skills": any }
        Insert: { "id": string; "run_id": string; "career_id": string; "rank": number; "match_score": number; "riasec_score": number | null; "ability_score": number | null; "value_score": number | null; "academic_score": number | null; "effective_weights": any; "confidence_score": number; "confidence_level": string; "evidence_coverage": number; "factors": any; "gaps": any; "required_skills": any }
        Update: { "id": string; "run_id": string; "career_id": string; "rank": number; "match_score": number; "riasec_score": number | null; "ability_score": number | null; "value_score": number | null; "academic_score": number | null; "effective_weights": any; "confidence_score": number; "confidence_level": string; "evidence_coverage": number; "factors": any; "gaps": any; "required_skills": any }
      }
      "career_education_paths": {
        Row: { "id": string; "career_id": string; "path_level": string; "field_of_study": string; "is_preferred": boolean; "notes": string | null; "created_at": string }
        Insert: { "id": string; "career_id": string; "path_level": string; "field_of_study": string; "is_preferred": boolean; "notes": string | null; "created_at": string }
        Update: { "id": string; "career_id": string; "path_level": string; "field_of_study": string; "is_preferred": boolean; "notes": string | null; "created_at": string }
      }
      "notifications": {
        Row: { "id": string; "recipient_user_id": string; "type": string; "title": string; "body": string | null; "action_url": string | null; "read_at": string | null; "created_at": string }
        Insert: { "id": string; "recipient_user_id": string; "type": string; "title": string; "body": string | null; "action_url": string | null; "read_at": string | null; "created_at": string }
        Update: { "id": string; "recipient_user_id": string; "type": string; "title": string; "body": string | null; "action_url": string | null; "read_at": string | null; "created_at": string }
      }
      "universities": {
        Row: { "id": string; "name": string; "short_name": string | null; "slug": string; "location_city": string | null; "location_region": string | null; "type": string | null; "scale": string | null; "description": string | null; "tuition_range_per_year": any[] | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "website": string | null; "admissions_website": string | null; "address": string | null; "ownership": string | null; "verification_status": string | null; "code": string | null }
        Insert: { "id": string; "name": string; "short_name": string | null; "slug": string; "location_city": string | null; "location_region": string | null; "type": string | null; "scale": string | null; "description": string | null; "tuition_range_per_year": any[] | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "website": string | null; "admissions_website": string | null; "address": string | null; "ownership": string | null; "verification_status": string | null; "code": string | null }
        Update: { "id": string; "name": string; "short_name": string | null; "slug": string; "location_city": string | null; "location_region": string | null; "type": string | null; "scale": string | null; "description": string | null; "tuition_range_per_year": any[] | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "website": string | null; "admissions_website": string | null; "address": string | null; "ownership": string | null; "verification_status": string | null; "code": string | null }
      }
      "assessment_dimension_scores": {
        Row: { "id": string; "result_id": string; "dimension_id": string; "dimension_code": string; "raw_score": number; "normalized_score": number; "questions_answered": number; "created_at": string }
        Insert: { "id": string; "result_id": string; "dimension_id": string; "dimension_code": string; "raw_score": number; "normalized_score": number; "questions_answered": number; "created_at": string }
        Update: { "id": string; "result_id": string; "dimension_id": string; "dimension_code": string; "raw_score": number; "normalized_score": number; "questions_answered": number; "created_at": string }
      }
      "student_interests": {
        Row: { "id": string; "student_id": string; "interest_area": string; "interest_level": number | null; "created_at": string; "category": string | null; "interest_name": string; "intensity": number | null; "source": string; "confidence": number | null }
        Insert: { "id": string; "student_id": string; "interest_area": string; "interest_level": number | null; "created_at": string; "category": string | null; "interest_name": string; "intensity": number | null; "source": string; "confidence": number | null }
        Update: { "id": string; "student_id": string; "interest_area": string; "interest_level": number | null; "created_at": string; "category": string | null; "interest_name": string; "intensity": number | null; "source": string; "confidence": number | null }
      }
      "user_roles": {
        Row: { "id": string; "user_id": string; "role": string; "created_at": string; "created_by": string | null }
        Insert: { "id": string; "user_id": string; "role": string; "created_at": string; "created_by": string | null }
        Update: { "id": string; "user_id": string; "role": string; "created_at": string; "created_by": string | null }
      }
      "career_major_mappings": {
        Row: { "id": string; "career_id": string; "major_id": string; "relationship_type": string; "relevance_score": number; "source": string | null; "created_at": string; "status": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null }
        Insert: { "id": string; "career_id": string; "major_id": string; "relationship_type": string; "relevance_score": number; "source": string | null; "created_at": string; "status": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null }
        Update: { "id": string; "career_id": string; "major_id": string; "relationship_type": string; "relevance_score": number; "source": string | null; "created_at": string; "status": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null }
      }
      "analytics_events": {
        Row: { "id": string; "user_id": string | null; "session_id": string | null; "event_name": string; "properties": any | null; "created_at": string }
        Insert: { "id": string; "user_id": string | null; "session_id": string | null; "event_name": string; "properties": any | null; "created_at": string }
        Update: { "id": string; "user_id": string | null; "session_id": string | null; "event_name": string; "properties": any | null; "created_at": string }
      }
      "parent_link_invitations": {
        Row: { "id": string; "student_id": string; "token_hash": string; "status": string; "expires_at": string; "used_at": string | null; "created_at": string }
        Insert: { "id": string; "student_id": string; "token_hash": string; "status": string; "expires_at": string; "used_at": string | null; "created_at": string }
        Update: { "id": string; "student_id": string; "token_hash": string; "status": string; "expires_at": string; "used_at": string | null; "created_at": string }
      }
      "majors": {
        Row: { "id": string; "name": string; "code": string | null; "slug": string; "field": string; "description": string | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "field_id": string | null }
        Insert: { "id": string; "name": string; "code": string | null; "slug": string; "field": string; "description": string | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "field_id": string | null }
        Update: { "id": string; "name": string; "code": string | null; "slug": string; "field": string; "description": string | null; "status": string; "created_at": string; "updated_at": string; "last_verified_at": string | null; "is_production_eligible": boolean; "source": string | null; "source_url": string | null; "verified_by": string | null; "field_id": string | null }
      }
      "content_categories": {
        Row: { "id": string; "name": string; "slug": string; "description": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "name": string; "slug": string; "description": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "name": string; "slug": string; "description": string | null; "created_at": string; "updated_at": string }
      }
      "parent_sharing_permissions": {
        Row: { "id": string; "link_id": string; "career_profile_level": number; "assessment_level": number; "roadmap_level": number; "academic_level": number; "updated_at": string }
        Insert: { "id": string; "link_id": string; "career_profile_level": number; "assessment_level": number; "roadmap_level": number; "academic_level": number; "updated_at": string }
        Update: { "id": string; "link_id": string; "career_profile_level": number; "assessment_level": number; "roadmap_level": number; "academic_level": number; "updated_at": string }
      }
      "assessments": {
        Row: { "id": string; "code": string; "name": string; "description": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "code": string; "name": string; "description": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "code": string; "name": string; "description": string | null; "created_at": string; "updated_at": string }
      }
      "university_recommendation_runs": {
        Row: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "data_reference_date": string; "created_at": string }
        Insert: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "data_reference_date": string; "created_at": string }
        Update: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "data_reference_date": string; "created_at": string }
      }
      "career_trial_challenges": {
        Row: { "id": string; "career_id": string; "title": string; "description": string | null; "challenge_type": string; "difficulty_level": string | null; "estimated_duration_minutes": number | null; "instructions": any | null; "resources": any | null; "evaluation_criteria": any | null; "is_active": boolean | null; "order_index": number | null; "created_at": string | null; "updated_at": string | null }
        Insert: { "id": string; "career_id": string; "title": string; "description": string | null; "challenge_type": string; "difficulty_level": string | null; "estimated_duration_minutes": number | null; "instructions": any | null; "resources": any | null; "evaluation_criteria": any | null; "is_active": boolean | null; "order_index": number | null; "created_at": string | null; "updated_at": string | null }
        Update: { "id": string; "career_id": string; "title": string; "description": string | null; "challenge_type": string; "difficulty_level": string | null; "estimated_duration_minutes": number | null; "instructions": any | null; "resources": any | null; "evaluation_criteria": any | null; "is_active": boolean | null; "order_index": number | null; "created_at": string | null; "updated_at": string | null }
      }
      "target_requirements": {
        Row: { "id": string; "target_type": string; "target_id": string; "requirement_code": string; "requirement_type": string; "comparison_operator": string; "requirement_value": string; "unit": string; "importance": string; "status": string; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "created_at": string; "is_production_eligible": boolean }
        Insert: { "id": string; "target_type": string; "target_id": string; "requirement_code": string; "requirement_type": string; "comparison_operator": string; "requirement_value": string; "unit": string; "importance": string; "status": string; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "created_at": string; "is_production_eligible": boolean }
        Update: { "id": string; "target_type": string; "target_id": string; "requirement_code": string; "requirement_type": string; "comparison_operator": string; "requirement_value": string; "unit": string; "importance": string; "status": string; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "created_at": string; "is_production_eligible": boolean }
      }
      "support_requests": {
        Row: { "id": string; "sender_user_id": string; "subject": string; "message": string; "status": string; "handled_by": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "sender_user_id": string; "subject": string; "message": string; "status": string; "handled_by": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "sender_user_id": string; "subject": string; "message": string; "status": string; "handled_by": string | null; "created_at": string; "updated_at": string }
      }
      "email_events": {
        Row: { "id": string; "provider_event_id": string; "type": string; "recipient_email": string; "payload": any; "created_at": string }
        Insert: { "id": string; "provider_event_id": string; "type": string; "recipient_email": string; "payload": any; "created_at": string }
        Update: { "id": string; "provider_event_id": string; "type": string; "recipient_email": string; "payload": any; "created_at": string }
      }
      "assessment_results": {
        Row: { "id": string; "session_id": string; "student_id": string; "version_id": string; "scoring_version": string; "completion_quality": any; "confidence": any; "is_current": boolean; "completed_at": string }
        Insert: { "id": string; "session_id": string; "student_id": string; "version_id": string; "scoring_version": string; "completion_quality": any; "confidence": any; "is_current": boolean; "completed_at": string }
        Update: { "id": string; "session_id": string; "student_id": string; "version_id": string; "scoring_version": string; "completion_quality": any; "confidence": any; "is_current": boolean; "completed_at": string }
      }
      "payment_transactions": {
        Row: { "id": string; "user_id": string; "amount": number; "status": string; "method": string; "plan_id": string; "created_at": string; "updated_at": string }
        Insert: { "id": string; "user_id": string; "amount": number; "status": string; "method": string; "plan_id": string; "created_at": string; "updated_at": string }
        Update: { "id": string; "user_id": string; "amount": number; "status": string; "method": string; "plan_id": string; "created_at": string; "updated_at": string }
      }
      "assessment_result_dimensions": {
        Row: { "id": string; "result_id": string; "dimension_id": string; "score": number }
        Insert: { "id": string; "result_id": string; "dimension_id": string; "score": number }
        Update: { "id": string; "result_id": string; "dimension_id": string; "score": number }
      }
      "audit_logs": {
        Row: { "id": string; "actor_user_id": string | null; "action": string; "entity_type": string; "entity_id": string | null; "metadata": any | null; "created_at": string }
        Insert: { "id": string; "actor_user_id": string | null; "action": string; "entity_type": string; "entity_id": string | null; "metadata": any | null; "created_at": string }
        Update: { "id": string; "actor_user_id": string | null; "action": string; "entity_type": string; "entity_id": string | null; "metadata": any | null; "created_at": string }
      }
      "student_activities": {
        Row: { "id": string; "student_id": string; "activity_type": string; "entity_type": string | null; "entity_id": string | null; "metadata": any | null; "created_at": string | null }
        Insert: { "id": string; "student_id": string; "activity_type": string; "entity_type": string | null; "entity_id": string | null; "metadata": any | null; "created_at": string | null }
        Update: { "id": string; "student_id": string; "activity_type": string; "entity_type": string | null; "entity_id": string | null; "metadata": any | null; "created_at": string | null }
      }
      "derived_profile_signals": {
        Row: { "id": string; "student_id": string; "signal_type": string; "value": number; "source_type": string; "source_id": string; "source_version": string; "confidence": number; "valid_until": string | null; "created_at": string }
        Insert: { "id": string; "student_id": string; "signal_type": string; "value": number; "source_type": string; "source_id": string; "source_version": string; "confidence": number; "valid_until": string | null; "created_at": string }
        Update: { "id": string; "student_id": string; "signal_type": string; "value": number; "source_type": string; "source_id": string; "source_version": string; "confidence": number; "valid_until": string | null; "created_at": string }
      }
      "careers": {
        Row: { "id": string; "code": string; "name": string; "name_en": string | null; "slug": string; "career_domain_code": string; "description": string | null; "daily_tasks": any | null; "work_environment": string | null; "skills": any | null; "tools_used": any | null; "education_paths": any | null; "career_paths": any | null; "related_careers": any | null; "market_data": any | null; "good_fit_indicators": any | null; "possible_challenges": any | null; "work_style": any | null; "company_examples": any | null; "riasec_profile": any | null; "riasec_primary": string | null; "ability_weights": any | null; "status": string; "source": string | null; "source_url": string | null; "source_type": string | null; "published_at": string | null; "last_verified_at": string | null; "created_by": string | null; "updated_by": string | null; "verified_by": string | null; "published_by": string | null; "created_at": string; "updated_at": string; "is_production_eligible": boolean }
        Insert: { "id": string; "code": string; "name": string; "name_en": string | null; "slug": string; "career_domain_code": string; "description": string | null; "daily_tasks": any | null; "work_environment": string | null; "skills": any | null; "tools_used": any | null; "education_paths": any | null; "career_paths": any | null; "related_careers": any | null; "market_data": any | null; "good_fit_indicators": any | null; "possible_challenges": any | null; "work_style": any | null; "company_examples": any | null; "riasec_profile": any | null; "riasec_primary": string | null; "ability_weights": any | null; "status": string; "source": string | null; "source_url": string | null; "source_type": string | null; "published_at": string | null; "last_verified_at": string | null; "created_by": string | null; "updated_by": string | null; "verified_by": string | null; "published_by": string | null; "created_at": string; "updated_at": string; "is_production_eligible": boolean }
        Update: { "id": string; "code": string; "name": string; "name_en": string | null; "slug": string; "career_domain_code": string; "description": string | null; "daily_tasks": any | null; "work_environment": string | null; "skills": any | null; "tools_used": any | null; "education_paths": any | null; "career_paths": any | null; "related_careers": any | null; "market_data": any | null; "good_fit_indicators": any | null; "possible_challenges": any | null; "work_style": any | null; "company_examples": any | null; "riasec_profile": any | null; "riasec_primary": string | null; "ability_weights": any | null; "status": string; "source": string | null; "source_url": string | null; "source_type": string | null; "published_at": string | null; "last_verified_at": string | null; "created_by": string | null; "updated_by": string | null; "verified_by": string | null; "published_by": string | null; "created_at": string; "updated_at": string; "is_production_eligible": boolean }
      }
      "fields": {
        Row: { "id": string; "name": string; "slug": string; "description": string | null; "icon": string | null; "display_order": number | null; "active": boolean | null; "riasec_mapping": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "name": string; "slug": string; "description": string | null; "icon": string | null; "display_order": number | null; "active": boolean | null; "riasec_mapping": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "name": string; "slug": string; "description": string | null; "icon": string | null; "display_order": number | null; "active": boolean | null; "riasec_mapping": string | null; "created_at": string; "updated_at": string }
      }
      "student_goals": {
        Row: { "id": string; "student_id": string; "goal_type": string; "goal_text": string; "target_year": number | null; "priority": number; "status": string; "created_at": string; "updated_at": string; "career_id": string | null; "major_id": string | null; "university_id": string | null; "is_primary": boolean; "readiness_score": number | null; "field_id": string | null }
        Insert: { "id": string; "student_id": string; "goal_type": string; "goal_text": string; "target_year": number | null; "priority": number; "status": string; "created_at": string; "updated_at": string; "career_id": string | null; "major_id": string | null; "university_id": string | null; "is_primary": boolean; "readiness_score": number | null; "field_id": string | null }
        Update: { "id": string; "student_id": string; "goal_type": string; "goal_text": string; "target_year": number | null; "priority": number; "status": string; "created_at": string; "updated_at": string; "career_id": string | null; "major_id": string | null; "university_id": string | null; "is_primary": boolean; "readiness_score": number | null; "field_id": string | null }
      }
      "match_runs": {
        Row: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "evidence_coverage": number; "overall_confidence_score": number; "overall_confidence_level": string; "status": string; "insufficient_reason": string | null; "started_at": string; "completed_at": string | null; "assessment_version": string; "scoring_version": string; "matching_algorithm_version": string }
        Insert: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "evidence_coverage": number; "overall_confidence_score": number; "overall_confidence_level": string; "status": string; "insufficient_reason": string | null; "started_at": string; "completed_at": string | null; "assessment_version": string; "scoring_version": string; "matching_algorithm_version": string }
        Update: { "id": string; "student_id": string; "profile_version": number; "algorithm_version": string; "evidence_coverage": number; "overall_confidence_score": number; "overall_confidence_level": string; "status": string; "insufficient_reason": string | null; "started_at": string; "completed_at": string | null; "assessment_version": string; "scoring_version": string; "matching_algorithm_version": string }
      }
      "assessment_dimensions": {
        Row: { "id": string; "version_id": string; "code": string; "name": string; "description": string | null; "framework": string; "raw_min": number | null; "raw_max": number | null; "normalization_formula": string | null; "matching_role": string | null }
        Insert: { "id": string; "version_id": string; "code": string; "name": string; "description": string | null; "framework": string; "raw_min": number | null; "raw_max": number | null; "normalization_formula": string | null; "matching_role": string | null }
        Update: { "id": string; "version_id": string; "code": string; "name": string; "description": string | null; "framework": string; "raw_min": number | null; "raw_max": number | null; "normalization_formula": string | null; "matching_role": string | null }
      }
      "assessment_versions": {
        Row: { "id": string; "assessment_id": string; "version_tag": string; "status": string; "scoring_rules_version": string; "created_at": string; "config": any | null }
        Insert: { "id": string; "assessment_id": string; "version_tag": string; "status": string; "scoring_rules_version": string; "created_at": string; "config": any | null }
        Update: { "id": string; "assessment_id": string; "version_tag": string; "status": string; "scoring_rules_version": string; "created_at": string; "config": any | null }
      }
      "career_audit_log": {
        Row: { "id": string; "career_id": string; "action": string; "from_status": string | null; "to_status": string | null; "changed_by": string | null; "changed_at": string; "metadata": any | null }
        Insert: { "id": string; "career_id": string; "action": string; "from_status": string | null; "to_status": string | null; "changed_by": string | null; "changed_at": string; "metadata": any | null }
        Update: { "id": string; "career_id": string; "action": string; "from_status": string | null; "to_status": string | null; "changed_by": string | null; "changed_at": string; "metadata": any | null }
      }
      "match_explanations": {
        Row: { "id": string; "match_id": string; "factor_type": string; "dimension": string; "label": string; "student_value": number | null; "career_requirement": number | null; "magnitude": number | null; "explanation": string | null; "created_at": string }
        Insert: { "id": string; "match_id": string; "factor_type": string; "dimension": string; "label": string; "student_value": number | null; "career_requirement": number | null; "magnitude": number | null; "explanation": string | null; "created_at": string }
        Update: { "id": string; "match_id": string; "factor_type": string; "dimension": string; "label": string; "student_value": number | null; "career_requirement": number | null; "magnitude": number | null; "explanation": string | null; "created_at": string }
      }
      "membership_subscriptions": {
        Row: { "id": string; "user_id": string; "organization_id": string | null; "plan_id": string; "starts_at": string; "ends_at": string; "is_active": boolean; "created_at": string }
        Insert: { "id": string; "user_id": string; "organization_id": string | null; "plan_id": string; "starts_at": string; "ends_at": string; "is_active": boolean; "created_at": string }
        Update: { "id": string; "user_id": string; "organization_id": string | null; "plan_id": string; "starts_at": string; "ends_at": string; "is_active": boolean; "created_at": string }
      }
      "content_pages": {
        Row: { "id": string; "author_id": string; "title": string; "slug": string; "body": string; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "author_id": string; "title": string; "slug": string; "body": string; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "author_id": string; "title": string; "slug": string; "body": string; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
      }
      "organizations": {
        Row: { "id": string; "owner_id": string; "name": string; "slug": string; "logo_url": string | null; "description": string | null; "contact_email": string | null; "contact_phone": string | null; "website_url": string | null; "status": string; "created_at": string; "updated_at": string }
        Insert: { "id": string; "owner_id": string; "name": string; "slug": string; "logo_url": string | null; "description": string | null; "contact_email": string | null; "contact_phone": string | null; "website_url": string | null; "status": string; "created_at": string; "updated_at": string }
        Update: { "id": string; "owner_id": string; "name": string; "slug": string; "logo_url": string | null; "description": string | null; "contact_email": string | null; "contact_phone": string | null; "website_url": string | null; "status": string; "created_at": string; "updated_at": string }
      }
      "parent_child_links": {
        Row: { "id": string; "parent_id": string; "student_id": string; "relationship_type": string; "status": string; "accepted_at": string | null; "revoked_at": string | null; "revoked_by": string | null; "created_at": string }
        Insert: { "id": string; "parent_id": string; "student_id": string; "relationship_type": string; "status": string; "accepted_at": string | null; "revoked_at": string | null; "revoked_by": string | null; "created_at": string }
        Update: { "id": string; "parent_id": string; "student_id": string; "relationship_type": string; "status": string; "accepted_at": string | null; "revoked_at": string | null; "revoked_by": string | null; "created_at": string }
      }
      "assessment_question_options": {
        Row: { "id": string; "question_id": string; "option_text": string; "option_value": number; "order_index": number }
        Insert: { "id": string; "question_id": string; "option_text": string; "option_value": number; "order_index": number }
        Update: { "id": string; "question_id": string; "option_text": string; "option_value": number; "order_index": number }
      }
      "profiles": {
        Row: { "id": string; "display_name": string | null; "avatar_url": string | null; "phone": string | null; "locale": string; "timezone": string; "created_at": string; "updated_at": string; "is_demo": boolean | null }
        Insert: { "id": string; "display_name": string | null; "avatar_url": string | null; "phone": string | null; "locale": string; "timezone": string; "created_at": string; "updated_at": string; "is_demo": boolean | null }
        Update: { "id": string; "display_name": string | null; "avatar_url": string | null; "phone": string | null; "locale": string; "timezone": string; "created_at": string; "updated_at": string; "is_demo": boolean | null }
      }
      "membership_plans": {
        Row: { "id": string; "code": string; "name": string; "description": string | null; "price_amount": number; "duration_days": number; "is_active": boolean; "created_at": string; "updated_at": string; "currency": string }
        Insert: { "id": string; "code": string; "name": string; "description": string | null; "price_amount": number; "duration_days": number; "is_active": boolean; "created_at": string; "updated_at": string; "currency": string }
        Update: { "id": string; "code": string; "name": string; "description": string | null; "price_amount": number; "duration_days": number; "is_active": boolean; "created_at": string; "updated_at": string; "currency": string }
      }
      "assessment_questions": {
        Row: { "id": string; "version_id": string; "dimension_id": string; "order_index": number; "question_text": string; "is_reverse_scored": boolean; "weight": number; "created_at": string; "question_code": string | null; "module": string | null }
        Insert: { "id": string; "version_id": string; "dimension_id": string; "order_index": number; "question_text": string; "is_reverse_scored": boolean; "weight": number; "created_at": string; "question_code": string | null; "module": string | null }
        Update: { "id": string; "version_id": string; "dimension_id": string; "order_index": number; "question_text": string; "is_reverse_scored": boolean; "weight": number; "created_at": string; "question_code": string | null; "module": string | null }
      }
      "career_skills": {
        Row: { "id": string; "career_id": string; "skill_name": string; "skill_category": string; "importance": string; "proficiency_level": string; "created_at": string }
        Insert: { "id": string; "career_id": string; "skill_name": string; "skill_category": string; "importance": string; "proficiency_level": string; "created_at": string }
        Update: { "id": string; "career_id": string; "skill_name": string; "skill_category": string; "importance": string; "proficiency_level": string; "created_at": string }
      }
      "account_preferences": {
        Row: { "user_id": string; "email_notifications": boolean; "product_updates": boolean; "updated_at": string }
        Insert: { "user_id": string; "email_notifications": boolean; "product_updates": boolean; "updated_at": string }
        Update: { "user_id": string; "email_notifications": boolean; "product_updates": boolean; "updated_at": string }
      }
      "student_profiles": {
        Row: { "id": string; "grade": number | null; "birth_year": number | null; "gender": string | null; "region": string | null; "study_location_pref": string | null; "family_support_level": number | null; "onboarding_step": number | null; "onboarding_completed_at": string | null; "updated_at": string }
        Insert: { "id": string; "grade": number | null; "birth_year": number | null; "gender": string | null; "region": string | null; "study_location_pref": string | null; "family_support_level": number | null; "onboarding_step": number | null; "onboarding_completed_at": string | null; "updated_at": string }
        Update: { "id": string; "grade": number | null; "birth_year": number | null; "gender": string | null; "region": string | null; "study_location_pref": string | null; "family_support_level": number | null; "onboarding_step": number | null; "onboarding_completed_at": string | null; "updated_at": string }
      }
      "roadmap_milestones": {
        Row: { "id": string; "roadmap_id": string; "title": string; "description": string | null; "target_date": string | null; "priority": string; "source_requirement_id": string | null; "status": string; "order_index": number; "completed_at": string | null; "created_at": string }
        Insert: { "id": string; "roadmap_id": string; "title": string; "description": string | null; "target_date": string | null; "priority": string; "source_requirement_id": string | null; "status": string; "order_index": number; "completed_at": string | null; "created_at": string }
        Update: { "id": string; "roadmap_id": string; "title": string; "description": string | null; "target_date": string | null; "priority": string; "source_requirement_id": string | null; "status": string; "order_index": number; "completed_at": string | null; "created_at": string }
      }
      "admission_data": {
        Row: { "id": string; "university_major_id": string; "academic_year": number; "admission_method": string; "subject_combination": string | null; "cutoff_score": number; "score_scale": number; "quota": number | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "data_status": string; "created_at": string; "is_production_eligible": boolean; "source": string | null }
        Insert: { "id": string; "university_major_id": string; "academic_year": number; "admission_method": string; "subject_combination": string | null; "cutoff_score": number; "score_scale": number; "quota": number | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "data_status": string; "created_at": string; "is_production_eligible": boolean; "source": string | null }
        Update: { "id": string; "university_major_id": string; "academic_year": number; "admission_method": string; "subject_combination": string | null; "cutoff_score": number; "score_scale": number; "quota": number | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "data_status": string; "created_at": string; "is_production_eligible": boolean; "source": string | null }
      }
      "inquiries": {
        Row: { "id": string; "sender_user_id": string; "organization_id": string; "subject": string; "message": string; "status": string; "created_at": string; "updated_at": string }
        Insert: { "id": string; "sender_user_id": string; "organization_id": string; "subject": string; "message": string; "status": string; "created_at": string; "updated_at": string }
        Update: { "id": string; "sender_user_id": string; "organization_id": string; "subject": string; "message": string; "status": string; "created_at": string; "updated_at": string }
      }
      "content_posts": {
        Row: { "id": string; "category_id": string | null; "author_id": string; "title": string; "slug": string; "excerpt": string | null; "body": string; "cover_image_url": string | null; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "category_id": string | null; "author_id": string; "title": string; "slug": string; "excerpt": string | null; "body": string; "cover_image_url": string | null; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "category_id": string | null; "author_id": string; "title": string; "slug": string; "excerpt": string | null; "body": string; "cover_image_url": string | null; "status": string; "seo_title": string | null; "seo_description": string | null; "published_at": string | null; "created_at": string; "updated_at": string }
      }
      "student_university_recommendations": {
        Row: { "id": string; "run_id": string; "university_id": string; "major_id": string; "admission_method": string | null; "historical_years_used": any[] | null; "admission_fit_score": number | null; "university_fit_score": number | null; "fit_breakdown": any; "tier": string; "data_quality": string; "created_at": string }
        Insert: { "id": string; "run_id": string; "university_id": string; "major_id": string; "admission_method": string | null; "historical_years_used": any[] | null; "admission_fit_score": number | null; "university_fit_score": number | null; "fit_breakdown": any; "tier": string; "data_quality": string; "created_at": string }
        Update: { "id": string; "run_id": string; "university_id": string; "major_id": string; "admission_method": string | null; "historical_years_used": any[] | null; "admission_fit_score": number | null; "university_fit_score": number | null; "fit_breakdown": any; "tier": string; "data_quality": string; "created_at": string }
      }
      "student_career_profiles": {
        Row: { "id": string; "student_id": string; "profile_version": number; "evidence_coverage": number; "profile_features": any; "source_assessment_versions": any; "is_current": boolean; "computed_at": string; "created_at": string; "updated_at": string }
        Insert: { "id": string; "student_id": string; "profile_version": number; "evidence_coverage": number; "profile_features": any; "source_assessment_versions": any; "is_current": boolean; "computed_at": string; "created_at": string; "updated_at": string }
        Update: { "id": string; "student_id": string; "profile_version": number; "evidence_coverage": number; "profile_features": any; "source_assessment_versions": any; "is_current": boolean; "computed_at": string; "created_at": string; "updated_at": string }
      }
      "university_majors": {
        Row: { "id": string; "university_id": string; "major_id": string | null; "program_name": string | null; "degree_level": string | null; "campus": string | null; "program_type": string | null; "active_from": number | null; "active_until": number | null; "created_at": string; "status": string | null; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "verification_status": string | null; "original_major_code": string; "original_major_name": string; "mapping_status": string }
        Insert: { "id": string; "university_id": string; "major_id": string | null; "program_name": string | null; "degree_level": string | null; "campus": string | null; "program_type": string | null; "active_from": number | null; "active_until": number | null; "created_at": string; "status": string | null; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "verification_status": string | null; "original_major_code": string; "original_major_name": string; "mapping_status": string }
        Update: { "id": string; "university_id": string; "major_id": string | null; "program_name": string | null; "degree_level": string | null; "campus": string | null; "program_type": string | null; "active_from": number | null; "active_until": number | null; "created_at": string; "status": string | null; "source": string | null; "source_url": string | null; "last_verified_at": string | null; "verified_by": string | null; "verification_status": string | null; "original_major_code": string; "original_major_name": string; "mapping_status": string }
      }
      "backup_student_interests": {
        Row: { "id": string | null; "student_id": string | null; "interest_area": string | null; "interest_level": number | null; "created_at": string | null }
        Insert: { "id": string | null; "student_id": string | null; "interest_area": string | null; "interest_level": number | null; "created_at": string | null }
        Update: { "id": string | null; "student_id": string | null; "interest_area": string | null; "interest_level": number | null; "created_at": string | null }
      }
      "app_settings": {
        Row: { "key": string; "value": any; "is_public": boolean; "updated_at": string; "updated_by": string | null }
        Insert: { "key": string; "value": any; "is_public": boolean; "updated_at": string; "updated_by": string | null }
        Update: { "key": string; "value": any; "is_public": boolean; "updated_at": string; "updated_by": string | null }
      }
      "leads": {
        Row: { "id": string; "email": string; "full_name": string | null; "source": string | null; "status": string | null; "created_at": string }
        Insert: { "id": string; "email": string; "full_name": string | null; "source": string | null; "status": string | null; "created_at": string }
        Update: { "id": string; "email": string; "full_name": string | null; "source": string | null; "status": string | null; "created_at": string }
      }
      "backup_academic_records": {
        Row: { "id": string | null; "student_id": string | null; "subject": string | null; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string | null; "updated_at": string | null }
        Insert: { "id": string | null; "student_id": string | null; "subject": string | null; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string | null; "updated_at": string | null }
        Update: { "id": string | null; "student_id": string | null; "subject": string | null; "performance_level": string | null; "gpa_range": string | null; "semester": string | null; "created_at": string | null; "updated_at": string | null }
      }
      "student_career_match_history": {
        Row: { "id": string; "student_id": string; "career_id": string; "match_run_id": string | null; "match_score": number | null; "viewed_at": string | null; "saved": boolean | null; "notes": string | null; "created_at": string | null }
        Insert: { "id": string; "student_id": string; "career_id": string; "match_run_id": string | null; "match_score": number | null; "viewed_at": string | null; "saved": boolean | null; "notes": string | null; "created_at": string | null }
        Update: { "id": string; "student_id": string; "career_id": string; "match_run_id": string | null; "match_score": number | null; "viewed_at": string | null; "saved": boolean | null; "notes": string | null; "created_at": string | null }
      }
      "roadmaps": {
        Row: { "id": string; "student_id": string; "target_career_id": string | null; "target_major_id": string | null; "target_university_id": string | null; "target_program_id": string | null; "roadmap_version": number; "generator_version": string; "profile_version": number; "academic_data_version": string; "status": string; "generated_at": string; "archived_at": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "student_id": string; "target_career_id": string | null; "target_major_id": string | null; "target_university_id": string | null; "target_program_id": string | null; "roadmap_version": number; "generator_version": string; "profile_version": number; "academic_data_version": string; "status": string; "generated_at": string; "archived_at": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "student_id": string; "target_career_id": string | null; "target_major_id": string | null; "target_university_id": string | null; "target_program_id": string | null; "roadmap_version": number; "generator_version": string; "profile_version": number; "academic_data_version": string; "status": string; "generated_at": string; "archived_at": string | null; "created_at": string; "updated_at": string }
      }
      "roadmap_tasks": {
        Row: { "id": string; "milestone_id": string; "title": string; "description": string | null; "task_type": string; "priority": string; "due_date": string | null; "estimated_effort": string | null; "status": string; "source_requirement_id": string | null; "depends_on": string | null; "evidence_required": boolean; "evidence_type": string; "completion_evidence": string | null; "completed_at": string | null; "created_at": string; "updated_at": string }
        Insert: { "id": string; "milestone_id": string; "title": string; "description": string | null; "task_type": string; "priority": string; "due_date": string | null; "estimated_effort": string | null; "status": string; "source_requirement_id": string | null; "depends_on": string | null; "evidence_required": boolean; "evidence_type": string; "completion_evidence": string | null; "completed_at": string | null; "created_at": string; "updated_at": string }
        Update: { "id": string; "milestone_id": string; "title": string; "description": string | null; "task_type": string; "priority": string; "due_date": string | null; "estimated_effort": string | null; "status": string; "source_requirement_id": string | null; "depends_on": string | null; "evidence_required": boolean; "evidence_type": string; "completion_evidence": string | null; "completed_at": string | null; "created_at": string; "updated_at": string }
      }
      "assessment_sessions": {
        Row: { "id": string; "student_id": string; "version_id": string; "status": string; "started_at": string; "completed_at": string | null; "updated_at": string }
        Insert: { "id": string; "student_id": string; "version_id": string; "status": string; "started_at": string; "completed_at": string | null; "updated_at": string }
        Update: { "id": string; "student_id": string; "version_id": string; "status": string; "started_at": string; "completed_at": string | null; "updated_at": string }
      }
      "parent_student_links": {
        Row: { "id": string; "parent_id": string; "student_id": string; "status": string; "relationship_type": string; "created_at": string; "updated_at": string }
        Insert: { "id": string; "parent_id": string; "student_id": string; "status": string; "relationship_type": string; "created_at": string; "updated_at": string }
        Update: { "id": string; "parent_id": string; "student_id": string; "status": string; "relationship_type": string; "created_at": string; "updated_at": string }
      }
      "favorites": {
        Row: { "id": string; "user_id": string; "entity_type": string; "entity_id": string; "created_at": string }
        Insert: { "id": string; "user_id": string; "entity_type": string; "entity_id": string; "created_at": string }
        Update: { "id": string; "user_id": string; "entity_type": string; "entity_id": string; "created_at": string }
      }
      "permission_audit_logs": {
        Row: { "id": string; "actor_id": string; "target_link_id": string; "action": string; "created_at": string }
        Insert: { "id": string; "actor_id": string; "target_link_id": string; "action": string; "created_at": string }
        Update: { "id": string; "actor_id": string; "target_link_id": string; "action": string; "created_at": string }
      }
      "student_saved_items": {
        Row: { "id": string; "student_id": string; "item_type": string; "item_id": string; "created_at": string }
        Insert: { "id": string; "student_id": string; "item_type": string; "item_id": string; "created_at": string }
        Update: { "id": string; "student_id": string; "item_type": string; "item_id": string; "created_at": string }
      }
      "career_bookmarks": {
        Row: { "id": string; "student_id": string; "career_id": string; "notes": string | null; "created_at": string | null }
        Insert: { "id": string; "student_id": string; "career_id": string; "notes": string | null; "created_at": string | null }
        Update: { "id": string; "student_id": string; "career_id": string; "notes": string | null; "created_at": string | null }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
