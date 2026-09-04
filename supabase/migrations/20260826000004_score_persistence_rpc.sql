-- RPC to atomically save assessment result and derived signals

CREATE OR REPLACE FUNCTION public.save_assessment_result(
    p_session_id uuid,
    p_student_id uuid,
    p_version_id uuid,
    p_scoring_version text,
    p_completion_quality jsonb,
    p_confidence jsonb,
    p_dimensions jsonb,      -- Array of { dimension_id, score }
    p_signals jsonb          -- Array of { signal_type, value, confidence, valid_until }
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result_id uuid;
    v_dim jsonb;
    v_sig jsonb;
    v_session_status public.assessment_session_status;
BEGIN
    -- 1. Lock the session row to prevent concurrent completion
    SELECT status INTO v_session_status
    FROM public.assessment_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF v_session_status = 'completed' THEN
        RAISE EXCEPTION 'Session is already completed';
    END IF;

    -- 2. Mark older results as not current
    UPDATE public.assessment_results
    SET is_current = false
    WHERE student_id = p_student_id 
      AND version_id = p_version_id 
      AND is_current = true;

    -- 3. Insert the new result
    INSERT INTO public.assessment_results (
        session_id, student_id, version_id, scoring_version, completion_quality, confidence, is_current
    ) VALUES (
        p_session_id, p_student_id, p_version_id, p_scoring_version, p_completion_quality, p_confidence, true
    ) RETURNING id INTO v_result_id;

    -- 4. Insert result dimensions
    FOR v_dim IN SELECT * FROM jsonb_array_elements(p_dimensions)
    LOOP
        INSERT INTO public.assessment_result_dimensions (
            result_id, dimension_id, score
        ) VALUES (
            v_result_id, 
            (v_dim->>'dimension_id')::uuid, 
            (v_dim->>'score')::numeric
        );
    END LOOP;

    -- 5. Upsert derived signals
    FOR v_sig IN SELECT * FROM jsonb_array_elements(p_signals)
    LOOP
        INSERT INTO public.derived_profile_signals (
            student_id, signal_type, value, source_type, source_id, source_version, confidence, valid_until
        ) VALUES (
            p_student_id, 
            v_sig->>'signal_type', 
            (v_sig->>'value')::numeric, 
            'assessment', 
            v_result_id, 
            p_scoring_version, 
            (v_sig->>'confidence')::numeric, 
            (v_sig->>'valid_until')::timestamptz
        )
        ON CONFLICT (source_id, signal_type) 
        DO UPDATE SET 
            value = EXCLUDED.value,
            confidence = EXCLUDED.confidence,
            valid_until = EXCLUDED.valid_until;
    END LOOP;

    -- 6. Mark session as completed
    UPDATE public.assessment_sessions
    SET status = 'completed', completed_at = now()
    WHERE id = p_session_id;

    RETURN v_result_id;
END;
$$;
