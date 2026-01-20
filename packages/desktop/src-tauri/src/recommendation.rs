use crate::types::{HeadingChunk, Note, RecommendationScore, WorkspaceSettings};
use crate::vector::cosine_similarity;
use anyhow::Result;
use std::collections::{HashMap, HashSet};

pub fn recommend_headings(
    current_heading_text: &str,
    current_embedding: &[f32],
    all_chunks: &[HeadingChunk],
    current_note_id: &str,
    settings: &WorkspaceSettings,
) -> Result<Vec<RecommendationScore>> {
    assert!(!current_heading_text.is_empty(), "Current heading text must not be empty");
    assert!(!current_embedding.is_empty(), "Current embedding must not be empty");

    let mut scores: Vec<RecommendationScore> = Vec::new();

    for chunk in all_chunks {
        if chunk.note_id == current_note_id {
            continue;
        }

        if let Some(ref chunk_embedding) = chunk.embedding {
            let similarity = cosine_similarity(current_embedding, chunk_embedding)?;

            if similarity < settings.semantic_threshold {
                continue;
            }

            let tag_similarity = calculate_tag_similarity(current_heading_text, &chunk.heading);

            let final_score = similarity + (tag_similarity * settings.tag_weight);

            let mut reasons = Vec::new();
            reasons.push(format!("Semantic similarity: {:.2}", similarity));
            if tag_similarity > 0.0 {
                reasons.push(format!("Shared context: {:.2}", tag_similarity));
            }

            scores.push(RecommendationScore {
                note_id: chunk.note_id.clone(),
                heading_id: Some(chunk.id.clone()),
                score: final_score,
                reasons,
            });
        }
    }

    scores.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    scores.truncate(settings.max_recommendations);

    assert!(
        scores.len() <= settings.max_recommendations,
        "Result must not exceed max recommendations"
    );

    Ok(scores)
}

pub fn recommend_notes(
    current_note: &Note,
    all_notes: &[Note],
    relations: &HashMap<String, f64>,
    settings: &WorkspaceSettings,
) -> Result<Vec<RecommendationScore>> {
    assert!(!current_note.id.is_empty(), "Current note ID must not be empty");

    let mut scores: Vec<RecommendationScore> = Vec::new();
    let current_tags: HashSet<String> = current_note.tags.iter().cloned().collect();

    for note in all_notes {
        if note.id == current_note.id || note.workspace_id != current_note.workspace_id {
            continue;
        }

        let mut score = 0.0;
        let mut reasons = Vec::new();

        if let (Some(ref current_emb), Some(ref note_emb)) =
            (&current_note.embedding, &note.embedding)
        {
            let similarity = cosine_similarity(current_emb, note_emb)?;
            if similarity < settings.semantic_threshold {
                continue;
            }
            score += similarity;
            reasons.push(format!("Semantic similarity: {:.2}", similarity));
        }

        let note_tags: HashSet<String> = note.tags.iter().cloned().collect();
        let common_tags = current_tags.intersection(&note_tags).count();
        if common_tags > 0 {
            let tag_score = common_tags as f64 * settings.tag_weight;
            score += tag_score;
            reasons.push(format!("Shared tags: {}", common_tags));
        }

        if let Some(last_viewed) = note.last_viewed_at {
            let now = chrono::Utc::now().timestamp_millis();
            let days_ago = (now - last_viewed) / (1000 * 60 * 60 * 24);
            if days_ago < 7 {
                let recency_score = settings.recency_weight * (1.0 - (days_ago as f64 / 7.0));
                score += recency_score;
                reasons.push(format!("Recently viewed: {} days ago", days_ago));
            }
        }

        if let Some(&relation_weight) = relations.get(&note.id) {
            let relation_score = relation_weight * settings.relation_weight;
            score += relation_score;
            reasons.push(format!("Explicit relation: {:.2}", relation_weight));
        }

        if score > 0.0 {
            scores.push(RecommendationScore {
                note_id: note.id.clone(),
                heading_id: None,
                score,
                reasons,
            });
        }
    }

    scores.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    scores.truncate(settings.max_recommendations);

    assert!(
        scores.len() <= settings.max_recommendations,
        "Result must not exceed max recommendations"
    );

    Ok(scores)
}

fn calculate_tag_similarity(text1: &str, text2: &str) -> f64 {
    assert!(!text1.is_empty() || !text2.is_empty(), "At least one text must not be empty");

    let words1: HashSet<&str> = text1.split_whitespace().collect();
    let words2: HashSet<&str> = text2.split_whitespace().collect();

    if words1.is_empty() || words2.is_empty() {
        return 0.0;
    }

    let intersection = words1.intersection(&words2).count();
    let union = words1.union(&words2).count();

    intersection as f64 / union as f64
}
