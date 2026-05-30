-- ============================================================
-- FOLLOWS: update counts + create notification on follow/unfollow
-- ============================================================

-- 1. Function: update follower/following counts
CREATE OR REPLACE FUNCTION public.handle_follow_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- increment followers_count on the person being followed
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- increment following_count on the person doing the following
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- decrement followers_count (floor at 0)
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    -- decrement following_count (floor at 0)
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for count updates
DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_change();


-- 3. Function: create follow notification
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS trigger AS $$
BEGIN
  -- Don't notify if following yourself
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, actor_id, type, message, read)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NULL,  -- Notifications page builds message from actor username
    false
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for notifications
DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();


-- ============================================================
-- LIKES: update likes_count on posts + create notification
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_like_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;

    -- Notify post owner (not if liking own post)
    IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, message, read)
      SELECT p.user_id, NEW.user_id, 'like', NEW.post_id, NULL, false
      FROM public.posts p WHERE p.id = NEW.post_id
      ON CONFLICT DO NOTHING;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_change();


-- ============================================================
-- COMMENTS: update comments_count on posts + create notification
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS trigger AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;

  -- Notify post owner (not if commenting on own post)
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, message, read)
    SELECT p.user_id, NEW.user_id, 'comment', NEW.post_id, NULL, false
    FROM public.posts p WHERE p.id = NEW.post_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_insert ON public.comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();


-- ============================================================
-- POSTS: update posts_count on profile
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_post_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_count ON public.posts;
CREATE TRIGGER on_post_count
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_count();


-- ============================================================
-- RECALCULATE existing counts (run once to fix any drift)
-- ============================================================

UPDATE public.profiles p SET
  followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = p.id),
  following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = p.id),
  posts_count     = (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id);
