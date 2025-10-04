# 🚀 I Just Shipped an API That Runs 100 Lighthouse Audits in 10 Minutes (Open Source)

<div align="center">
  <img src="https://github.com/SamuelChojnacki/lighthouse-parallele/blob/main/logo.png?raw=true" alt="Lighthouse Parallele" width="400" />
</div>

---

**Here's the thing**: If you've ever run Lighthouse audits at scale, you know the pain. Sequential execution is brutally slow. 100 audits? That's over an hour of waiting.

**I built something better.**

## [⭐ Check it out on GitHub](https://github.com/SamuelChojnacki/lighthouse-parallele)

---

## What This Actually Does

**Lighthouse Parallele** is a production-ready API that runs Google Lighthouse audits massively in parallel. Think of it as putting your performance testing on steroids.

**The numbers speak for themselves:**

On a standard 16 vCPU cloud server, I'm seeing **7.5x speedup** across the board. What used to take 75 minutes now takes 10. That's not an exaggeration, that's just proper parallelization with smart resource management.

Here's what that looks like in practice:

| Your Task | Old Way | New Way | Time Saved |
|-----------|---------|---------|------------|
| 10 audits | 7.5 minutes | 60 seconds | **6.5 min** |
| 50 audits | 37 minutes | 5 minutes | **32 min** |
| 100 audits | 75 minutes | 10 minutes | **65 min** |

Imagine running this daily. That's **hours** back in your week.

---

## Who This Is For

**If you're a performance engineer** tired of babysitting sequential audit runs, this is your new best friend. Set it, forget it, get a webhook when it's done.

**If you're running an SEO agency**, you can now audit entire client portfolios in minutes instead of hours. Your reports can be in French, German, Spanish, Japanese or any of the 20+ languages Lighthouse supports.

**If you're managing multiple web properties**, you finally have a way to monitor everything without the bottleneck. Batch process hundreds of URLs with a single API call.

**If you're a developer** who values your time, you'll appreciate the Docker setup that gets you running in under 5 minutes.

---

## The Stack (Because You're Curious)

I built this on **NestJS** because I needed something robust that wouldn't fall over under load. The job queue runs on **BullMQ** with Redis, which handles the concurrency and retry logic beautifully. Each audit runs in an isolated child process with its own Chrome instance, so there's zero cross-contamination.

The frontend is **React 19** with Tailwind CSS because life's too short for ugly dashboards. Everything's TypeScript, everything's tested, everything's production-ready.

Oh, and it scales horizontally. Throw more servers at it and watch it fly.

---

## Features That Actually Matter

**Multi-language reports** mean your French client gets a French report, your German client gets a German report. No manual translation, no extra work. Just pass a `locale` parameter.

**Webhook integration** means it fits into your CI/CD pipeline like it was always meant to be there. Audit on every deploy, block releases that tank your performance score. All automated.

**Batch processing** means you're not making 100 API calls for 100 URLs. One call, hundreds of audits, all running in parallel.

**Prometheus metrics** mean you can actually monitor this thing in production. Because "it works on my machine" doesn't cut it when you're running at scale.

---

## Get Started in 5 Minutes

```bash
git clone https://github.com/SamuelChojnacki/lighthouse-parallele.git
cd lighthouse-parallele

# Generate your API key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > .api-key

# Create your environment
cat > .env << EOF
PORT=3002
REDIS_HOST=redis
API_KEY=$(cat .api-key)
WORKER_CONCURRENCY=8
EOF

# Fire it up
docker-compose up --build
```

That's it. Your API is running on `localhost:3002`.

Now test it:

```bash
curl -X POST http://localhost:3002/lighthouse/batch \
  -H "X-API-Key: $(cat .api-key)" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com", "https://github.com", "https://stackoverflow.com"],
    "categories": ["performance", "seo", "accessibility"]
  }'
```

You'll get a batch ID back. Check the status, grab your reports. It really is that simple.

---

## The Architecture (For the Curious)

Here's how it actually works under the hood:

Your React dashboard talks to the NestJS API. The API pushes jobs to BullMQ, which manages a pool of worker processes. Each worker spawns isolated child processes running Chrome instances. Lighthouse does its thing, results flow back through the queue, and you get your reports.

The magic is in the **concurrency control**. You can run 8, 16, 24, even 32 workers depending on your server specs. The system adapts to your resources and maxes out your throughput without falling over.

Everything's stateless, so you can scale horizontally. Add more servers, add more workers, handle more load. Simple as that.

---

## Scaling: How Much Power Do You Actually Need?

Here's the honest truth about resource requirements. I've tested this extensively, and here's what works:

| Your Server | Recommended Workers | What You Can Handle |
|-------------|---------------------|---------------------|
| 4 vCPU, 8GB RAM | 4-6 workers | ~20-30 concurrent audits |
| 8 vCPU, 16GB RAM | 8-12 workers | ~40-60 concurrent audits |
| 16 vCPU, 64GB RAM | 16-24 workers ⭐ | ~80-120 concurrent audits |
| 32 vCPU, 128GB RAM | 32-48 workers | ~160-240 concurrent audits |

**The sweet spot?** 16 vCPU with 24 workers. That's where you get the best performance-per-dollar ratio.

**Each Chrome instance** uses about 400MB RAM and 0.5-1 vCPU during active auditing. The rest is mostly network wait time, which is why you can oversubscribe your CPU (run more workers than cores).

**Pro tip:** Start conservative (1 worker per vCPU), monitor your CPU usage, then gradually increase. If you're consistently under 80% CPU, you have room to add more workers.

---

## Real Talk: What You Can Actually Do With This

**Monitor your entire web portfolio** without thinking about it. Schedule daily audits, track trends over time, get alerts when performance tanks.

**Integrate it into your deployment pipeline**. Every time you push to production, run a full audit suite. If scores drop below threshold, roll back automatically.

**Generate client reports** in their native language. Your French clients get French reports, your Japanese clients get Japanese reports. All from the same API.

**Compare before/after** when you make optimizations. Run audits on the old version, run audits on the new version, see the actual impact in real numbers.

**Audit competitor sites** at scale. Want to benchmark against 50 competitors? That's a 5-minute job, not a 6-hour marathon.

---

## What's Coming Next

I'm not done yet. Here's what's on the roadmap:

**GraphQL API** for more flexible querying. Sometimes REST isn't enough.

**WebSocket support** for real-time progress updates. Watch your audits complete in real-time.

**Historical analytics** because trends matter more than snapshots. See how your performance evolves over weeks and months.

**Slack and Discord integrations** because not everyone lives in email. Get notifications where your team actually is.

**Scheduled recurring audits** because automation should be automatic. Set it once, forget about it.

**PDF reports** because sometimes your boss wants a pretty document, not a JSON file.

---

## Why Open Source?

Because I believe good tools should be accessible to everyone. Performance monitoring shouldn't cost a fortune or lock you into a vendor.

I built this to solve my own problem, but I realized it could help thousands of developers facing the same challenges. So here it is, MIT licensed, yours to use however you need.

Want to contribute? The codebase is clean, well-documented, and waiting for your pull requests. Check out [CONTRIBUTING.md](https://github.com/SamuelChojnacki/lighthouse-parallele/blob/main/CONTRIBUTING.md) to get started.

Want to just use it? That's cool too. Fork it, deploy it, make it yours.

---

## Try It Today

**[→ Star the repo on GitHub](https://github.com/SamuelChojnacki/lighthouse-parallele)**

**[→ Read the full documentation](https://github.com/SamuelChojnacki/lighthouse-parallele#readme)**

**[→ See the code](https://github.com/SamuelChojnacki/lighthouse-parallele)**

Deploy it on your server, test it with your sites, and let me know what you think. I'm actively looking for feedback, bug reports, feature requests, and contributors.

**Found a bug?** [Open an issue](https://github.com/SamuelChojnacki/lighthouse-parallele/issues)

**Have an idea?** [Start a discussion](https://github.com/SamuelChojnacki/lighthouse-parallele/discussions)

**Want to contribute?** [Check out the contribution guide](https://github.com/SamuelChojnacki/lighthouse-parallele/blob/main/CONTRIBUTING.md)

---

## The Bottom Line

Performance testing shouldn't be slow. Monitoring shouldn't be expensive. Good tools shouldn't be locked behind paywalls.

**Lighthouse Parallele** is my answer to that. It's fast, it's free, it's open source, and it works.

Give it a shot. Let me know what you build with it.

---

<div align="center">

**Built with ❤️ by the [Sabaï team](https://github.com/SamuelChojnacki)**

[GitHub](https://github.com/SamuelChojnacki/lighthouse-parallele) • [Documentation](https://github.com/SamuelChojnacki/lighthouse-parallele#readme) • [Contributing](https://github.com/SamuelChojnacki/lighthouse-parallele/blob/main/CONTRIBUTING.md)

⭐ **Star the repo if this saves you time**

</div>

---

## P.S.

If you deploy this in production, I'd genuinely love to hear about it. What's your setup? How many workers are you running? What kind of speedup are you seeing?

Drop a comment, open a discussion, or just send a message. Let's make performance testing better together.
