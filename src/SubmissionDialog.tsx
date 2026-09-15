import { useEffect, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, PawPrint, Upload, X } from 'lucide-react';
import {
  chronicleApiEnabled,
  getCurrentParentProfile,
  getRememberedParent,
  loadPendingEntries,
  reviewEntry,
  submitChronicleEntry,
  verifyInvite,
  type ParentProfile,
  type PendingEntry,
} from './lib/chronicleApi';

type Props = { open: boolean; dogNames: string[]; onClose: () => void };

export default function SubmissionDialog({ open, dogNames, onClose }: Props) {
  const [parent, setParent] = useState<string | null>(() => getRememberedParent());
  const [nickname, setNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [mode, setMode] = useState<'submit' | 'review'>('submit');
  const [pending, setPending] = useState<PendingEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', close);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !parent || !chronicleApiEnabled) return;
    getCurrentParentProfile().then(setProfile).catch(() => undefined);
  }, [open, parent]);

  useEffect(() => {
    if (mode !== 'review' || !profile?.is_admin) return;
    setBusy(true);
    loadPendingEntries().then(setPending).catch(reason => setError(reason instanceof Error ? reason.message : '读取失败')).finally(() => setBusy(false));
  }, [mode, profile]);

  if (!open) return null;

  const identify = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      setParent(await verifyInvite(inviteCode.trim(), nickname.trim()));
      setProfile(await getCurrentParentProfile());
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : '验证失败'); }
    finally { setBusy(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await submitChronicleEntry({
        eventDate: String(form.get('eventDate')),
        title: String(form.get('title')),
        description: String(form.get('description')),
        category: String(form.get('category')) as 'milestone' | 'funny' | 'meeting' | 'legend',
        dogNames: selectedDogs,
        image: (form.get('image') as File)?.size ? form.get('image') as File : undefined,
        video: (form.get('video') as File)?.size ? form.get('video') as File : undefined,
        audio: (form.get('audio') as File)?.size ? form.get('audio') as File : undefined,
      });
      setSent(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '投稿失败'); }
    finally { setBusy(false); }
  };

  const review = async (id: number, status: 'published' | 'rejected') => {
    setBusy(true); setError('');
    try {
      await reviewEntry(id, status);
      setPending(items => items.filter(item => item.id !== id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : '审核失败'); }
    finally { setBusy(false); }
  };

  const field = 'w-full rounded-2xl border border-muted bg-white/70 px-4 py-3 text-sm outline-none focus:border-accent';

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-fg/25 p-0 backdrop-blur-sm md:items-center md:p-6" role="dialog" aria-modal="true" aria-label="记录一件狗事">
      <div className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-bg p-7 shadow-2xl md:rounded-[2rem] md:p-10">
        <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 hover:bg-muted/40" aria-label="关闭"><X size={20}/></button>
        <div className="mb-8 flex items-center gap-3"><PawPrint className="text-accent"/><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-fg/40">Dog Chronicle</p><h2 className="font-serif text-3xl font-black">{mode === 'review' ? '审核狗狗新闻' : '记录一件狗事'}</h2></div></div>

        {profile?.is_admin && parent && !sent && (
          <div className="mb-7 flex rounded-full bg-muted/35 p-1 text-xs font-bold">
            <button onClick={() => setMode('submit')} className={`flex-1 rounded-full py-2 ${mode === 'submit' ? 'bg-white shadow-sm' : 'text-fg/45'}`}>投稿</button>
            <button onClick={() => setMode('review')} className={`flex-1 rounded-full py-2 ${mode === 'review' ? 'bg-white shadow-sm' : 'text-fg/45'}`}>待审核</button>
          </div>
        )}

        {!chronicleApiEnabled ? (
          <div className="rounded-2xl bg-muted/35 p-5 text-sm leading-7">投稿入口已经准备好，站长配置 Supabase 环境变量后即可开放。现有时间轴不会受到影响。</div>
        ) : mode === 'review' && profile?.is_admin ? (
          <div className="space-y-4">
            {busy && pending.length === 0 ? <div className="flex justify-center py-16"><LoaderCircle className="animate-spin"/></div> : pending.length === 0 ? <div className="py-16 text-center text-sm text-fg/45">没有待审核的狗狗新闻</div> : pending.map(item => (
              <article key={item.id} className="rounded-2xl border border-muted bg-white/60 p-5">
                <div className="mb-2 flex items-center justify-between gap-3"><time className="text-[11px] font-bold text-accent">{item.event_date}</time><span className="text-[10px] text-fg/35">{item.dog_names.join(' · ')}</span></div>
                <h3 className="font-serif text-lg font-bold">{item.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fg/65">{item.description}</p>
                {item.image_url && <img src={item.image_url} alt="投稿图片" className="mt-4 max-h-52 w-full rounded-xl object-cover"/>}
                {item.video_url && <video src={item.video_url} controls className="mt-4 max-h-52 w-full rounded-xl"/>}
                {item.audio_url && <audio src={item.audio_url} controls className="mt-4 w-full"/>}
                <div className="mt-5 flex gap-2"><button disabled={busy} onClick={() => review(item.id, 'published')} className="flex-1 rounded-full bg-accent py-2.5 text-xs font-bold text-bg">批准发布</button><button disabled={busy} onClick={() => review(item.id, 'rejected')} className="flex-1 rounded-full bg-muted/60 py-2.5 text-xs font-bold">退回</button></div>
              </article>
            ))}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
        ) : sent ? (
          <div className="py-14 text-center"><Check className="mx-auto mb-5 text-accent" size={44}/><h3 className="font-serif text-2xl font-bold">投稿收到啦！</h3><p className="mt-3 text-sm text-fg/55">审核通过后，它就会出现在狗狗编年史里。</p><button onClick={onClose} className="mt-8 rounded-full bg-accent px-7 py-3 text-sm font-bold text-bg">完成</button></div>
        ) : !parent ? (
          <form onSubmit={identify} className="space-y-5">
            <p className="text-sm leading-7 text-fg/60">第一次来？输入群里的邀请码和你的昵称。这个设备会记住你，以后可以直接投稿。</p>
            <label className="block text-xs font-bold">邀请码<input className={`${field} mt-2`} value={inviteCode} onChange={e => setInviteCode(e.target.value)} required autoFocus /></label>
            <label className="block text-xs font-bold">你的昵称<input className={`${field} mt-2`} value={nickname} onChange={e => setNickname(e.target.value)} maxLength={30} required /></label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-bold text-bg disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>}验证家长身份</button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-xs text-fg/45">投稿人：{parent}</p>
            <label className="block text-xs font-bold">发生日期<input name="eventDate" type="date" className={`${field} mt-2`} required /></label>
            <label className="block text-xs font-bold">标题<input name="title" className={`${field} mt-2`} maxLength={80} placeholder="今天谁又整活了？" required /></label>
            <label className="block text-xs font-bold">故事<textarea name="description" className={`${field} mt-2 min-h-28 resize-y`} maxLength={2000} placeholder="发生了什么？" required /></label>
            <fieldset><legend className="mb-2 text-xs font-bold">相关小狗</legend><div className="flex flex-wrap gap-2">{dogNames.map(dog => <button type="button" key={dog} onClick={() => setSelectedDogs(value => value.includes(dog) ? value.filter(item => item !== dog) : [...value, dog])} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedDogs.includes(dog) ? 'bg-accent text-bg' : 'bg-muted/45 text-fg/60'}`}>{dog}</button>)}</div>{selectedDogs.length === 0 && <p className="mt-2 text-[11px] text-fg/40">请至少选择一只小狗</p>}</fieldset>
            <label className="block text-xs font-bold">类型<select name="category" className={`${field} mt-2`}><option value="funny">搞笑</option><option value="milestone">里程碑</option><option value="meeting">相聚</option><option value="legend">传说</option></select></label>
            <div className="grid gap-3 md:grid-cols-3">{([['image','照片','image/*'],['video','视频','video/*'],['audio','语音','audio/*']] as const).map(([name,label,accept]) => <label key={name} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-muted px-4 py-3 text-xs font-bold hover:border-accent"><Upload size={15}/>{label}<input name={name} type="file" accept={accept} className="sr-only"/></label>)}</div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button disabled={busy || selectedDogs.length === 0} className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-bold text-bg disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>}提交审核</button>
          </form>
        )}
      </div>
    </div>
  );
}
