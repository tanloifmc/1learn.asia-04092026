# Core Feature Modules

Each folder owns one reusable capability: its server queries, validation, feature services and feature-specific UI. Routes in `src/app` compose features but must not accumulate business queries.

Future product-specific code belongs in a separate feature folder, such as `src/features/travel/`. Core features must never import a product feature.
