import { Controller, Post, Body, Get } from '@nestjs/common';
import { GameService, GameStateDto, ActionResponseDto } from './game.service';

@Controller('api/game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Post('step')
  async step(@Body() gameState: GameStateDto): Promise<ActionResponseDto> {
    return this.gameService.getNextMove(gameState);
  }
}
