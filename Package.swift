// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterJinja2",
    products: [
        .library(name: "TreeSitterJinja2", targets: ["TreeSitterJinja2"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterJinja2",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterJinja2Tests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterJinja2",
            ],
            path: "bindings/swift/TreeSitterJinja2Tests"
        )
    ],
    cLanguageStandard: .c11
)
