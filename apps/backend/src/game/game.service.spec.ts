import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('GameService', () => {
  let service: GameService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return move action when RL service responds', async () => {
    const gameState = {
      grid: Array(24).fill(Array(10).fill(0)),
      currentPiece: null,
      score: 0,
      gameOver: false,
    };

    const mockAxiosResponse: AxiosResponse = {
      data: { action: 'rotate' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockAxiosResponse));

    const result = await service.getNextMove(gameState);
    expect(result).toEqual({ action: 'rotate' });
  });

  it('should return fallback action "none" when RL service fails', async () => {
    const gameState = {
      grid: Array(24).fill(Array(10).fill(0)),
      currentPiece: null,
      score: 0,
      gameOver: false,
    };

    jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('Connection refused')));

    const result = await service.getNextMove(gameState);
    expect(result).toEqual({ action: 'none' });
  });
});
