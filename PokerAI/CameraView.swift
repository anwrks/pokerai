import SwiftUI
import AVFoundation

// MARK: - Camera Popup Overlay
struct CameraSheet: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)
                .onTapGesture {
                    viewModel.stopCapture()
                }
            
            // Camera popup card
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text(headerText)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button(action: {
                        viewModel.stopCapture()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(Color.black.opacity(0.8))
                
                // Camera view with green box
                CameraViewWithFrame(viewModel: viewModel)
                    .frame(height: 400)
                
                // Controls
                VStack(spacing: 16) {
                    if viewModel.isAnalyzing {
                        HStack(spacing: 12) {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                            Text("Analyzing cards...")
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                        .padding()
                    } else {
                        Button(action: {
                            viewModel.captureAndAnalyze()
                        }) {
                            HStack(spacing: 12) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 20))
                                Text("Capture Cards")
                                    .font(.system(size: 18, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [Color.green, Color.green.opacity(0.8)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                        }
                        .padding(.horizontal)
                    }
                }
                .frame(height: 80)
                .background(Color.black.opacity(0.9))
            }
            .frame(maxWidth: 500)
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: 10)
            .padding()
        }
    }
    
    var headerText: String {
        if viewModel.currentCaptureType == .hole {
            return (viewModel.gameMode == .omahaHiLo || viewModel.gameMode == .omahaHigh) ? 
                   "Scan 4 Hole Cards" : 
                   "Scan 2 Hole Cards"
        } else {
            if viewModel.communityCards.isEmpty {
                return "Scan Flop (3 Cards)"
            } else if viewModel.communityCards.count == 3 {
                return "Scan Turn Card"
            } else {
                return "Scan River Card"
            }
        }
    }
}

// MARK: - Camera View with Green Frame
struct CameraViewWithFrame: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                CameraView(viewModel: viewModel)
                
                // Green targeting frame
                VStack {
                    Spacer()
                    
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.green, lineWidth: 3)
                            .frame(width: geometry.size.width * 0.85, height: geometry.size.height * 0.5)
                        
                        VStack {
                            Spacer()
                            Text(instructionText)
                                .font(.caption)
                                .foregroundColor(.green)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.black.opacity(0.7))
                                .cornerRadius(6)
                                .offset(y: -20)
                        }
                        .frame(width: geometry.size.width * 0.85, height: geometry.size.height * 0.5)
                    }
                    
                    Spacer()
                }
            }
        }
        .background(Color.black)
    }
    
    var instructionText: String {
        if viewModel.currentCaptureType == .hole {
            return (viewModel.gameMode == .omahaHiLo || viewModel.gameMode == .omahaHigh) ? 
                   "Place all 4 cards in frame" : 
                   "Place both cards in frame"
        } else {
            if viewModel.communityCards.isEmpty {
                return "Place all 3 flop cards in frame"
            } else if viewModel.communityCards.count == 3 {
                return "Place turn card in frame"
            } else {
                return "Place river card in frame"
            }
        }
    }
}

// MARK: - UIKit Camera View
struct CameraView: UIViewRepresentable {
    @ObservedObject var viewModel: PokerViewModel
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .black
        
        if let session = viewModel.captureSession {
            let previewLayer = AVCaptureVideoPreviewLayer(session: session)
            previewLayer.videoGravity = .resizeAspectFill
            previewLayer.frame = view.bounds
            view.layer.addSublayer(previewLayer)
            viewModel.previewLayer = previewLayer
        }
        
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = viewModel.previewLayer {
            DispatchQueue.main.async {
                previewLayer.frame = uiView.bounds
            }
        }
    }
}
