use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadingChunk {
    pub id: String,
    pub note_id: String,
    pub heading: String,
    pub level: u8,
    pub content: String,
    pub embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_viewed_at: Option<i64>,
    pub embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendationScore {
    pub note_id: String,
    pub heading_id: Option<String>,
    pub score: f64,
    pub reasons: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub id: String,
    pub max_recommendations: usize,
    pub semantic_threshold: f64,
    pub tag_weight: f64,
    pub recency_weight: f64,
    pub engagement_weight: f64,
    pub relation_weight: f64,
}

impl Default for WorkspaceSettings {
    fn default() -> Self {
        Self {
            id: String::from("default"),
            max_recommendations: 10,
            semantic_threshold: 0.3,
            tag_weight: 0.2,
            recency_weight: 0.15,
            engagement_weight: 0.1,
            relation_weight: 0.3,
        }
    }
}
