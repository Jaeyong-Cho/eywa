#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod types;
mod vector;
mod recommendation;

use types::{HeadingChunk, Note, RecommendationScore, WorkspaceSettings};
use std::collections::HashMap;

#[tauri::command]
fn calculate_cosine_similarity(a: Vec<f32>, b: Vec<f32>) -> Result<f64, String> {
    vector::cosine_similarity(&a, &b).map_err(|e| e.to_string())
}

#[tauri::command]
fn recommend_headings(
    current_heading_text: String,
    current_embedding: Vec<f32>,
    all_chunks: Vec<HeadingChunk>,
    current_note_id: String,
    settings: WorkspaceSettings,
) -> Result<Vec<RecommendationScore>, String> {
    recommendation::recommend_headings(
        &current_heading_text,
        &current_embedding,
        &all_chunks,
        &current_note_id,
        &settings,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn recommend_notes(
    current_note: Note,
    all_notes: Vec<Note>,
    relations: HashMap<String, f64>,
    settings: WorkspaceSettings,
) -> Result<Vec<RecommendationScore>, String> {
    recommendation::recommend_notes(&current_note, &all_notes, &relations, &settings)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            calculate_cosine_similarity,
            recommend_headings,
            recommend_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
