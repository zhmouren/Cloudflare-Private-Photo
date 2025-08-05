import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface Env {
    PHOTO_BUCKET: R2Bucket;

    // Vars from wrangler.toml
    ALLOWED_ORIGINS: string;

    // Secrets (set in .dev.vars for local, and in dashboard for production)
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    SECRET_KEY: string;
    R2_BUCKET_NAME: string; // 新增：用于本地开发
}

const getS3Client = (env: Env) => {
    return new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    });
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const corsHeaders = {
            "Access-Control-Allow-Origin": env.ALLOWED_ORIGINS,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Secret-Key",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // --- 获取 R2 桶名称 ---
        // 在本地开发时，从 env.R2_BUCKET_NAME 获取
        // 在部署到生产环境时，从 env.PHOTO_BUCKET 的属性中获取
        // 使用 ?? 运算符，如果前者不存在就使用后者
        const bucketName = env.R2_BUCKET_NAME ?? (env.PHOTO_BUCKET as any).bucketName;
        if (!bucketName) {
            return new Response("R2 bucket name is not configured.", { status: 500, headers: corsHeaders });
        }

        const secretKey = request.headers.get("X-Secret-Key");
        if (url.pathname.startsWith('/api/') && request.method === 'POST') {
            if (!secretKey || secretKey !== env.SECRET_KEY) {
                return new Response("Unauthorized", { status: 401, headers: corsHeaders });
            }
        }

        // API: List all photos
        if (url.pathname === '/api/list' && request.method === 'GET') {
            const list = await env.PHOTO_BUCKET.list();
            const photos = list.objects.map(obj => ({
                key: obj.key,
                uploaded: obj.uploaded.toISOString(),
                size: obj.size,
            })).sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

            return new Response(JSON.stringify(photos), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // API: Get a presigned URL for upload
        if (url.pathname === '/api/upload' && request.method === 'POST') {
            try {
                const { filename, customPath } = await request.json<{ filename: string, customPath?: string }>();
                if (!filename) throw new Error('Filename is required');

                const finalPath = customPath ? customPath.trim().replace(/^\/|\/$/g, '') : 'uploads';
                const objectKey = `${finalPath}/${Date.now()}-${filename}`;

                const s3 = getS3Client(env);
                const command = new PutObjectCommand({ Bucket: bucketName, Key: objectKey });
                const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

                return new Response(JSON.stringify({ signedUrl, objectKey }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error: any) {
                return new Response(error.message, { status: 400, headers: corsHeaders });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};
