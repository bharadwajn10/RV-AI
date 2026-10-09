# Notes

## Mismatches between BUILD_GUIDE and Frontend Implementation
- The Learner Dashboard in `mockData.js` returns `progress`, `topicsCompleted`, etc. inside the subject array items, but the `BUILD_GUIDE` (section 4.4) implies some fields might differ slightly. I have implemented the Pydantic schemas to strictly match what `mockData.js` currently provides (as per instruction: "Where this guide and the real front end code disagree, follow the front end, keep going, and record the difference").

## Agnes API Smoke Test
- Attempted to run `smoke_agnes.py` to test streaming and strict JSON mode.
- **Result:** Failed with `401 Unauthorized` (Invalid token).
- **Action:** A real `AGNES_API_KEY` must be added to the `.env` file before these tests will pass. Once the key is available, the backend must test for strict JSON mode. If JSON mode is not supported by `agnes-3.0-flash`, a repair/validation step will be needed when parsing generated content.

## Local LLM Setup
- Not yet running as I do not have the local HuggingFace Qwen3.5 4B model downloaded. `llama-server` and `bench_local.py` will require the local environment to provide this binary.
