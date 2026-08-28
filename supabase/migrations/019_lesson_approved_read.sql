-- Allow authenticated users to read all approved lessons (Learn & Earn carousel).

drop policy if exists "Authenticated read approved lessons" on public.lesson_submissions;
create policy "Authenticated read approved lessons"
  on public.lesson_submissions for select to authenticated
  using (status = 'approved');
