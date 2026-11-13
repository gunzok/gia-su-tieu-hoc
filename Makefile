# Lệnh kiểm tra chung cho người và agent. CI (.github/workflows/ci.yml) chạy cùng các bước này.
# Dùng: make check (trước khi mở PR) · make build (thử đóng gói) · make security

.PHONY: check lint typecheck test build build-web security

check: lint typecheck test

lint:
	npx expo lint

typecheck:
	@test -f expo-env.d.ts || printf '/// <reference types="expo/types" />\n' > expo-env.d.ts
	npx tsc --noEmit

test:
	npm test -- --ci

build: build-web
	npx expo export --platform ios --platform android --output-dir build/export-native

build-web:
	npm run build:web

security:
	npm audit --omit=dev --audit-level=critical
	@if grep -rlE 'sk-ant-|service_role|ANTHROPIC_API_KEY|192\.168\.' dist 2>/dev/null; then \
		echo "Bản build web có chuỗi nhạy cảm"; exit 1; fi
