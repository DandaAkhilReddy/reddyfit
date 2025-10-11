//
//  PhotoService.swift
//  ReddyFitElite
//
//  Photo capture and steganography service
//

import Foundation
import UIKit
import AVFoundation
import Photos
import Combine

@MainActor
class PhotoService: ObservableObject {
    @Published var capturedImage: UIImage?
    @Published var scannedMetadata: PhotoExtractResponse?
    @Published var isProcessing = false
    @Published var errorMessage: String?

    private let apiService = APIService.shared

    // MARK: - Camera Authorization
    func requestCameraPermission() async -> Bool {
        let status = AVCaptureDevice.authorizationStatus(for: .video)

        switch status {
        case .authorized:
            return true

        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)

        case .denied, .restricted:
            errorMessage = "Camera access denied. Please enable in Settings."
            return false

        @unknown default:
            return false
        }
    }

    // MARK: - Photo Library Authorization
    func requestPhotoLibraryPermission() async -> Bool {
        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)

        switch status {
        case .authorized, .limited:
            return true

        case .notDetermined:
            let newStatus = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
            return newStatus == .authorized || newStatus == .limited

        case .denied, .restricted:
            errorMessage = "Photo library access denied. Please enable in Settings."
            return false

        @unknown default:
            return false
        }
    }

    // MARK: - Embed Metadata in Photo
    func embedWorkoutMetadata(
        userId: String,
        workoutId: String?,
        image: UIImage,
        includeAchievements: Bool = true,
        includeStats: Bool = true
    ) async -> UIImage? {
        isProcessing = true
        errorMessage = nil

        guard let imageData = image.jpegData(compressionQuality: 0.9) else {
            errorMessage = "Failed to convert image to data"
            isProcessing = false
            return nil
        }

        do {
            let response = try await apiService.embedWorkoutMetadata(
                userId: userId,
                workoutId: workoutId,
                photo: imageData,
                includeAchievements: includeAchievements,
                includeStats: includeStats
            )

            if response.success {
                // Decode base64 photo data
                if let photoData = Data(base64Encoded: response.photoData),
                   let embeddedImage = UIImage(data: photoData) {
                    isProcessing = false
                    return embeddedImage
                }
            }

            errorMessage = response.message
            isProcessing = false
            return nil

        } catch {
            errorMessage = error.localizedDescription
            isProcessing = false
            return nil
        }
    }

    // MARK: - Extract Metadata from Photo
    func extractMetadata(from image: UIImage) async -> PhotoExtractResponse? {
        isProcessing = true
        errorMessage = nil

        guard let imageData = image.jpegData(compressionQuality: 0.9) else {
            errorMessage = "Failed to convert image to data"
            isProcessing = false
            return nil
        }

        do {
            let response = try await apiService.extractWorkoutMetadata(photo: imageData)

            scannedMetadata = response
            isProcessing = false

            return response

        } catch {
            errorMessage = error.localizedDescription
            isProcessing = false
            return nil
        }
    }

    // MARK: - Save to Photo Library
    func saveToPhotoLibrary(_ image: UIImage) async -> Bool {
        let hasPermission = await requestPhotoLibraryPermission()
        guard hasPermission else { return false }

        return await withCheckedContinuation { continuation in
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { success, error in
                if let error = error {
                    Task { @MainActor in
                        self.errorMessage = error.localizedDescription
                    }
                }
                continuation.resume(returning: success)
            }
        }
    }

    // MARK: - Share Photo
    func sharePhoto(_ image: UIImage) -> UIActivityViewController {
        let activityViewController = UIActivityViewController(
            activityItems: [image],
            applicationActivities: nil
        )

        activityViewController.excludedActivityTypes = [
            .assignToContact,
            .addToReadingList,
            .openInIBooks
        ]

        return activityViewController
    }

    // MARK: - Create Workout Achievement Photo
    func createAchievementPhoto(
        userId: String,
        workoutId: String?,
        backgroundImage: UIImage? = nil
    ) async -> UIImage? {
        // Use background image or create default
        let baseImage = backgroundImage ?? createDefaultBackground()

        // Add workout overlay (you can customize this)
        let overlayedImage = addWorkoutOverlay(to: baseImage)

        // Embed metadata
        return await embedWorkoutMetadata(
            userId: userId,
            workoutId: workoutId,
            image: overlayedImage
        )
    }

    // MARK: - Helper: Create Default Background
    private func createDefaultBackground() -> UIImage {
        let size = CGSize(width: 1080, height: 1080)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { context in
            // Gradient background
            let colors = [
                UIColor(red: 0.1, green: 0.1, blue: 0.3, alpha: 1.0).cgColor,
                UIColor(red: 0.2, green: 0.1, blue: 0.4, alpha: 1.0).cgColor
            ]
            let gradient = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: colors as CFArray,
                locations: [0, 1]
            )!

            context.cgContext.drawLinearGradient(
                gradient,
                start: CGPoint(x: 0, y: 0),
                end: CGPoint(x: size.width, y: size.height),
                options: []
            )
        }
    }

    // MARK: - Helper: Add Workout Overlay
    private func addWorkoutOverlay(to image: UIImage) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: image.size)

        return renderer.image { context in
            // Draw base image
            image.draw(at: .zero)

            // Add ReddyFit watermark
            let watermark = "ReddyFit"
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 48, weight: .bold),
                .foregroundColor: UIColor.white.withAlphaComponent(0.3)
            ]

            let watermarkSize = watermark.size(withAttributes: attributes)
            let watermarkPoint = CGPoint(
                x: image.size.width - watermarkSize.width - 40,
                y: image.size.height - watermarkSize.height - 40
            )

            watermark.draw(at: watermarkPoint, withAttributes: attributes)
        }
    }

    // MARK: - Scan Photo with Camera
    func scanPhotoFromCamera() async -> UIImage? {
        let hasPermission = await requestCameraPermission()
        guard hasPermission else { return nil }

        // In production, this would open the camera
        // For now, return nil to indicate camera UI should be shown
        return nil
    }

    // MARK: - Load Photo from Library
    func loadPhotoFromLibrary() async -> UIImage? {
        let hasPermission = await requestPhotoLibraryPermission()
        guard hasPermission else { return nil }

        // In production, this would open photo picker
        // For now, return nil to indicate picker UI should be shown
        return nil
    }
}
