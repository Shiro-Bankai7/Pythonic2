-- Fix ambiguous column references in get_leaderboard_page() ranking ORDER BY clauses.
-- In PL/pgSQL, RETURNS TABLE column names are variables, so unqualified names like
-- total_xp/weekly_xp can conflict with CTE columns.

create or replace function public.get_leaderboard_page(
  p_scope text,
  p_track_id text default null,
  p_group_id uuid default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table(
  rank bigint,
  user_id uuid,
  username text,
  avatar text,
  streak integer,
  total_xp bigint,
  weekly_xp bigint,
  track_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
begin
  if p_scope = 'track' then
    return query
    with agg as (
      select
        p.user_id,
        max(pr.username) as username,
        max(pr.avatar) as avatar,
        coalesce(max(s.current_streak), 0) as streak,
        coalesce(sum(x.amount), 0)::bigint as total_xp,
        coalesce(sum(case when x.created_at >= now() - interval '7 days' then x.amount else 0 end), 0)::bigint as weekly_xp
      from public.user_progress p
      join public.profiles pr on pr.user_id = p.user_id
      left join public.streaks s on s.user_id = p.user_id
      left join public.xp_events x on x.user_id = p.user_id and x.meta->>'track_id' = p_track_id
      where p.track_id = p_track_id
      group by p.user_id
    ),
    ranked as (
      select row_number() over (order by agg.total_xp desc, agg.streak desc, agg.user_id) as rank, * from agg
    )
    select ranked.rank, ranked.user_id, ranked.username, ranked.avatar, ranked.streak, ranked.total_xp, ranked.weekly_xp, p_track_id
    from ranked
    order by ranked.rank
    offset v_offset limit p_page_size;
    return;
  end if;

  if p_scope = 'group' then
    return query
    with agg as (
      select
        gm.user_id,
        max(pr.username) as username,
        max(pr.avatar) as avatar,
        coalesce(max(s.current_streak), 0) as streak,
        coalesce(sum(x.amount), 0)::bigint as total_xp,
        coalesce(sum(case when x.created_at >= now() - interval '7 days' then x.amount else 0 end), 0)::bigint as weekly_xp
      from public.group_members gm
      join public.profiles pr on pr.user_id = gm.user_id
      left join public.streaks s on s.user_id = gm.user_id
      left join public.xp_events x on x.user_id = gm.user_id
      where gm.group_id = p_group_id
      group by gm.user_id
    ),
    ranked as (
      select row_number() over (order by agg.total_xp desc, agg.streak desc, agg.user_id) as rank, * from agg
    )
    select ranked.rank, ranked.user_id, ranked.username, ranked.avatar, ranked.streak, ranked.total_xp, ranked.weekly_xp, null::text
    from ranked
    order by ranked.rank
    offset v_offset limit p_page_size;
    return;
  end if;

  if p_scope = 'weekly' then
    return query
    with agg as (
      select
        p.user_id,
        max(p.username) as username,
        max(p.avatar) as avatar,
        coalesce(max(s.current_streak), 0) as streak,
        coalesce(sum(case when x.created_at >= now() - interval '7 days' then x.amount else 0 end), 0)::bigint as total_xp,
        coalesce(sum(case when x.created_at >= now() - interval '7 days' then x.amount else 0 end), 0)::bigint as weekly_xp
      from public.profiles p
      left join public.streaks s on s.user_id = p.user_id
      left join public.xp_events x on x.user_id = p.user_id
      group by p.user_id
    ),
    ranked as (
      select row_number() over (order by agg.weekly_xp desc, agg.streak desc, agg.user_id) as rank, * from agg
    )
    select ranked.rank, ranked.user_id, ranked.username, ranked.avatar, ranked.streak, ranked.total_xp, ranked.weekly_xp, null::text
    from ranked
    order by ranked.rank
    offset v_offset limit p_page_size;
    return;
  end if;

  return query
  with agg as (
    select
      p.user_id,
      max(p.username) as username,
      max(p.avatar) as avatar,
      coalesce(max(s.current_streak), 0) as streak,
      coalesce(sum(x.amount), 0)::bigint as total_xp,
      coalesce(sum(case when x.created_at >= now() - interval '7 days' then x.amount else 0 end), 0)::bigint as weekly_xp
    from public.profiles p
    left join public.streaks s on s.user_id = p.user_id
    left join public.xp_events x on x.user_id = p.user_id
    group by p.user_id
  ),
  ranked as (
    select row_number() over (order by agg.total_xp desc, agg.streak desc, agg.user_id) as rank, * from agg
  )
  select ranked.rank, ranked.user_id, ranked.username, ranked.avatar, ranked.streak, ranked.total_xp, ranked.weekly_xp, null::text
  from ranked
  order by ranked.rank
  offset v_offset limit p_page_size;
end;
$$;
