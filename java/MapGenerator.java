/*
 Simple Java example that generates a map JSON to stdout.
 Compile: javac java/MapGenerator.java
 Run: java -cp java MapGenerator > game/map.json
*/
import java.util.Random;
import java.io.PrintWriter;

public class MapGenerator {
    public static void main(String[] args) throws Exception {
        int width = 120, height = 80, tileSize = 16;
        Random r = new Random();
        int[][] tiles = new int[height][width];
        for(int y=0;y<height;y++){
            for(int x=0;x<width;x++){
                double v = r.nextDouble();
                if(v < 0.08) tiles[y][x] = 1; // water
                else if(v < 0.12) tiles[y][x] = 2; // tree
                else tiles[y][x] = 0; // grass
            }
        }
        // small lake
        int cx = 10 + r.nextInt(width-20);
        int cy = 10 + r.nextInt(height-20);
        for(int dy=-6;dy<=6;dy++){
            for(int dx=-10;dx<=10;dx++){
                int yy = cy+dy, xx = cx+dx;
                if(yy>=0 && yy<height && xx>=0 && xx<width){
                    if((dx*dx)/100.0 + (dy*dy)/36.0 < 1.0) tiles[yy][xx]=1;
                }
            }
        }
        PrintWriter out = new PrintWriter(System.out);
        out.println("{");
        out.println("  \"width\": " + width + ",");
        out.println("  \"height\": " + height + ",");
        out.println("  \"tileSize\": " + tileSize + ",");
        out.println("  \"tiles\": [");
        for(int y=0;y<height;y++){
            out.print("    [");
            for(int x=0;x<width;x++){
                out.print(tiles[y][x]);
                if(x<width-1) out.print(',');
            }
            out.print("]");
            if(y<height-1) out.println(','); else out.println();
        }
        out.println("  ]");
        out.println("}");
        out.flush();
    }
}
