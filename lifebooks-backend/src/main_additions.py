# Story Management
@app.route("/api/story", methods=["POST"])
def create_story():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    title = data.get("title", "")
    content = data.get("content", "")
    
    if not title:
        return jsonify({"message": "Story title is required"}), 400

    try:
        story = Story(
            user_id=user.id,
            title=title,
            content=content
        )
        story.update_word_count()
        
        db.session.add(story)
        db.session.commit()
        
        return jsonify({
            "message": "Story created successfully",
            "story": story.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Story creation failed",
            "error": str(e)
        }), 500

@app.route("/api/story/<int:story_id>", methods=["GET"])
def get_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    return jsonify({"story": story.to_dict()}), 200

@app.route("/api/story/<int:story_id>", methods=["PUT"])
def update_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    data = request.get_json()
    
    try:
        if "title" in data:
            story.title = data["title"]
        if "content" in data:
            story.content = data["content"]
            story.update_word_count()
        if "summary" in data:
            story.summary = data["summary"]
        if "tags" in data:
            story.set_tags_list(data["tags"])
        
        story.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
        
        return jsonify({
            "message": "Story updated successfully",
            "story": story.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Story update failed",
            "error": str(e)
        }), 500

@app.route("/api/story/<int:story_id>/auto-save", methods=["POST"])
def auto_save_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    data = request.get_json()
    content = data.get("content", "")
    
    try:
        story.auto_save_content(content)
        
        return jsonify({
            "message": "Auto-save successful",
            "last_auto_save": story.last_auto_save.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Auto-save failed",
            "error": str(e)
        }), 500

@app.route("/api/stories", methods=["GET"])
def get_user_stories():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    stories = Story.query.filter_by(user_id=user.id).order_by(Story.updated_at.desc()).all()
    
    return jsonify({
        "stories": [story.to_dict() for story in stories]
    }), 200

# Database initialization
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)

