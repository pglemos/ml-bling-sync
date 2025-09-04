import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP" },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      );
    }

    // Em um sistema real, você salvaria o arquivo no S3/R2 ou outro storage
    // Por enquanto, vamos simular com uma URL do Unsplash
    const mockImageUrls = [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"
    ];

    const randomUrl = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
    const key = `uploads/${Date.now()}-${file.name}`;

    // Simular delay de upload
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      url: randomUrl,
      key,
      size: file.size,
      type: file.type,
      name: file.name
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Chave do arquivo é obrigatória" },
        { status: 400 }
      );
    }

    // Em um sistema real, você removeria o arquivo do storage
    // Por enquanto, apenas simular sucesso
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Arquivo removido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao remover arquivo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
