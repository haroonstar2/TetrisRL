import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CurrentPieceDto {
  shape: number[][];
  x: number;
  y: number;
  type: string;
}

export interface GameStateDto {
  grid: number[][];
  currentPiece?: CurrentPieceDto | null;
  score: number;
  gameOver: boolean;
}

export interface ActionResponseDto {
  action: string;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(private readonly httpService: HttpService) {}

  async getNextMove(gameState: GameStateDto): Promise<ActionResponseDto> {
    const rlServiceUrl = process.env.RL_SERVICE_URL || 'http://localhost:8000';
    try {
      const response = await firstValueFrom(
        this.httpService.post<ActionResponseDto>(`${rlServiceUrl}/act`, gameState)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to reach RL Service at ${rlServiceUrl}: ${error.message}`);
      // Fallback response if RL service is unreachable
      return { action: 'none' };
    }
  }
}
