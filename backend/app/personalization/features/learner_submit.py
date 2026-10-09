from app.personalization.registry import feature
from app.core.context import AppContext
from app.user_db.models import Attempt, Mastery
import uuid
import datetime

@feature("submit_answer", roles=("learner",))
async def submit_answer(ctx: AppContext, payload: dict):
    class_id = "ds-class-1"
    topic_id = payload.get("topic_id")
    answer_text = payload.get("answer")
    question_text = payload.get("question")
    
    # 1. Ask Router to grade it
    system_prompt = "You are a strict grader. Return a JSON with a 'score' between 0 and 100, and 'feedback' string."
    user_prompt = f"Question: {question_text}\nAnswer: {answer_text}"
    
    # Simple JSON mode evaluation
    eval_result = await ctx.llm_router.route(
        task="grade_conceptual",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        priority="interactive",
        stream=False
    )
    
    score = eval_result.get("score", 0)
    feedback = eval_result.get("feedback", "No feedback.")
    
    # 2. Record Attempt
    attempt = Attempt(
        id=str(uuid.uuid4()),
        learner_id=ctx.user.id,
        class_id=class_id,
        topic_id=topic_id,
        kind="conceptual",
        correct=score / 100.0,
        transcript=answer_text,
        feedback=feedback,
        created_at=datetime.datetime.utcnow()
    )
    ctx.user_db.add(attempt)
    
    # 3. Update Mastery
    mastery = ctx.user_db.query(Mastery).filter(Mastery.learner_id == ctx.user.id, Mastery.topic_id == topic_id).first()
    if not mastery:
        mastery = Mastery(
            id=str(uuid.uuid4()),
            learner_id=ctx.user.id,
            topic_id=topic_id,
            score=score,
            attempts=1,
            last_practiced_at=datetime.datetime.utcnow(),
            history=[score]
        )
        ctx.user_db.add(mastery)
    else:
        # Simple moving average for hackathon
        mastery.score = (mastery.score * mastery.attempts + score) / (mastery.attempts + 1)
        mastery.attempts += 1
        mastery.last_practiced_at = datetime.datetime.utcnow()
        if not mastery.history:
            mastery.history = []
        hist = list(mastery.history)
        hist.append(score)
        mastery.history = hist

    ctx.user_db.commit()
    return {"score": score, "feedback": feedback, "new_mastery": mastery.score}
