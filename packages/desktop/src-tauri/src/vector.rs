use anyhow::{Result, anyhow};

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> Result<f64> {
    assert_eq!(a.len(), b.len(), "Vectors must have the same length");
    assert!(!a.is_empty(), "Vectors must not be empty");

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();

    let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude_a == 0.0 || magnitude_b == 0.0 {
        return Err(anyhow!("Vector magnitude is zero"));
    }

    let similarity = dot_product / (magnitude_a * magnitude_b);
    assert!(similarity >= -1.0 && similarity <= 1.0, "Cosine similarity must be between -1 and 1");

    Ok(similarity as f64)
}

pub fn normalize_vector(vec: &mut [f32]) {
    assert!(!vec.is_empty(), "Vector must not be empty");

    let magnitude: f32 = vec.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude > 0.0 {
        for val in vec.iter_mut() {
            *val /= magnitude;
        }
    }

    assert!(
        vec.iter().map(|x| x * x).sum::<f32>().sqrt() - 1.0 < 0.0001 || magnitude == 0.0,
        "Normalized vector must have magnitude 1"
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&a, &b).unwrap();
        assert!((sim - 1.0).abs() < 0.0001);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        let sim = cosine_similarity(&a, &b).unwrap();
        assert!(sim.abs() < 0.0001);
    }

    #[test]
    fn test_normalize_vector() {
        let mut vec = vec![3.0, 4.0];
        normalize_vector(&mut vec);
        assert!((vec[0] - 0.6).abs() < 0.0001);
        assert!((vec[1] - 0.8).abs() < 0.0001);
    }
}
